"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  UserSquare2,
  Menu,
  UserPlus2,
  Pencil,
  Trash2,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
};

type InventoryUser = {
  id: string;
  name: string;
  accent: string;
  createdAt: string;
  items: InventoryItem[];
};

type SortOption = "name-asc" | "name-desc" | "qty-desc" | "qty-asc";

const ACCENT_CLASSES = [
  "from-[#1DA1F2] to-[#0B5ED7]",
  "from-[#17A2B8] to-[#0D9488]",
  "from-[#6366F1] to-[#4338CA]",
  "from-[#22D3EE] to-[#0EA5E9]",
  "from-[#FF8A65] to-[#FF7043]",
  "from-[#F97316] to-[#EA580C]",
  "from-[#A855F7] to-[#7C3AED]",
  "from-[#F59E0B] to-[#D97706]",
];

const pickAccentForId = (value: string) => {
  if (!value) {
    return ACCENT_CLASSES[0];
  }

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  const accentIndex = Math.abs(hash) % ACCENT_CLASSES.length;
  return ACCENT_CLASSES[accentIndex];
};

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function InventoryByUserPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [users, setUsers] = useState<InventoryUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNameDraft, setUserNameDraft] = useState("");

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [quantityDraft, setQuantityDraft] = useState<string>("");
  const [savingItem, setSavingItem] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      setBootstrapping(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBootstrapping(false);
        router.replace("/login");
        return;
      }
      setUser(user);
      setBootstrapping(false);
    };

    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setBootstrapping(false);
        return;
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setUsers([]);
        setSelectedUserId(null);
        setSearchQuery("");
        setUsersLoading(true);
        setUsersError(null);
        setItemsError(null);
        setBootstrapping(false);
        router.replace("/login");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const loadUsers = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setUsersLoading(true);
    setUsersError(null);
    setItemsError(null);

    const { data, error } = await supabase
      .from("inventory_users")
      .select(
        `
          id,
          username,
          created_at,
          items:inventory_items (
            id,
            item_name,
            quantity,
            created_at
          )
        `
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading inventory users:", error);
      setUsers([]);
      setUsersError(
        "We couldn’t load your inventory yet. Please refresh and try again."
      );
      setUsersLoading(false);
      return;
    }

    type InventoryUserRow = {
      id: string;
      username: string;
      created_at: string;
      items: Array<{
        id: string;
        item_name: string;
        quantity: number;
        created_at: string;
      }> | null;
    };

    const mapped =
      (data as InventoryUserRow[] | null)?.map((row) => ({
        id: row.id,
        name: row.username,
        createdAt: row.created_at,
        accent: pickAccentForId(row.id),
        items:
          row.items?.map((item) => ({
            id: item.id,
            name: item.item_name,
            quantity: item.quantity,
            createdAt: item.created_at,
          })) ?? [],
      })) ?? [];

    setUsers(mapped);
    setSelectedUserId((previous) => {
      if (!mapped.length) {
        return null;
      }
      if (previous && mapped.some((entry) => entry.id === previous)) {
        return previous;
      }
      return mapped[0].id;
    });
    setUsersLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const baseList = normalized
      ? users.filter(({ name }) => name.toLowerCase().includes(normalized))
      : users;

    return [...baseList].sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, users]);

  useEffect(() => {
    if (!selectedUserId && filteredUsers[0]) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((user) => user.id === selectedUserId) ?? null;
  }, [users, selectedUserId]);

  const sortedItems = useMemo(() => {
    if (!selectedUser) return [];
    const items = [...selectedUser.items];

    switch (sortOption) {
      case "name-desc":
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case "qty-desc":
        return items.sort((a, b) => b.quantity - a.quantity);
      case "qty-asc":
        return items.sort((a, b) => a.quantity - b.quantity);
      case "name-asc":
      default:
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [selectedUser, sortOption]);

  const activeSortIcon = useMemo(() => {
    switch (sortOption) {
      case "name-desc":
        return <SortDesc className="h-4 w-4" strokeWidth={2.2} />;
      case "qty-desc":
        return <SortDesc className="h-4 w-4" strokeWidth={2.2} />;
      case "qty-asc":
        return <SortAsc className="h-4 w-4" strokeWidth={2.2} />;
      case "name-asc":
      default:
        return <SortAsc className="h-4 w-4" strokeWidth={2.2} />;
    }
  }, [sortOption]);

  const isItemFormValid = useMemo(() => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      return false;
    }

    const qty = Number.parseInt(newItemQuantity, 10);
    if (Number.isNaN(qty) || qty < 0) {
      return false;
    }

    return true;
  }, [newItemName, newItemQuantity]);

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);
    setIsSidebarOpen(false);
  };

  const handleAddUser = async () => {
    if (!user?.id) return;
    const trimmed = newUserName.trim();
    if (!trimmed) return;

    setSavingUser(true);
    setUsersError(null);

    try {
      const { data, error } = await supabase
        .from("inventory_users")
        .insert({
          owner_id: user.id,
          username: trimmed,
        })
        .select("id")
        .single();

      if (error) throw error;

      const newId = data?.id ?? null;
      setNewUserName("");
      setIsAddingUser(false);
      setSearchQuery("");
      await loadUsers();
      if (newId) {
        setSelectedUserId(newId);
      }
    } catch (error) {
      console.error("Error adding inventory user:", error);
      setUsersError("Could not add that user. Please try again.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!user?.id) return;
    setUsersError(null);
    setDeletingUserId(id);

    try {
      await supabase.from("inventory_items").delete().eq("user_id", id);
      const { error } = await supabase
        .from("inventory_users")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) throw error;

      if (selectedUserId === id) {
        setSelectedUserId(null);
      }

      await loadUsers();
    } catch (error) {
      console.error("Error deleting inventory user:", error);
      setUsersError("Could not delete that user. Please try again.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleStartEditUser = (id: string, name: string) => {
    setEditingUserId(id);
    setUserNameDraft(name);
  };

  const handleCommitEditUser = async () => {
    if (!editingUserId || !user?.id) {
      setEditingUserId(null);
      setUserNameDraft("");
      return;
    }

    const trimmed = userNameDraft.trim();
    if (!trimmed) {
      setEditingUserId(null);
      setUserNameDraft("");
      return;
    }

    setSavingUser(true);
    setUsersError(null);

    try {
      const { error } = await supabase
        .from("inventory_users")
        .update({ username: trimmed })
        .eq("id", editingUserId)
        .eq("owner_id", user.id);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error("Error updating inventory user:", error);
      setUsersError("Could not rename that user. Please try again.");
    } finally {
      setSavingUser(false);
      setEditingUserId(null);
      setUserNameDraft("");
    }
  };

  const handleAddItem = async () => {
    if (!selectedUserId) return;
    const trimmedName = newItemName.trim();
    if (!trimmedName) return;
    const qty = Number.parseInt(newItemQuantity, 10);
    if (Number.isNaN(qty) || qty < 0) return;

    setSavingItem(true);
    setItemsError(null);

    try {
      const { error } = await supabase.from("inventory_items").insert({
        user_id: selectedUserId,
        item_name: trimmedName,
        quantity: qty,
      });

      if (error) throw error;

      setNewItemName("");
      setNewItemQuantity("");
      setIsAddingItem(false);
      await loadUsers();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      setItemsError("Could not add that item. Please try again.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItemsError(null);
    setDeletingItemId(itemId);

    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      setItemsError("Could not delete that item. Please try again.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleStartEditQuantity = (itemId: string, quantity: number) => {
    setEditingItemId(itemId);
    setQuantityDraft(String(quantity));
  };

  const commitQuantityChange = async () => {
    if (!editingItemId) return;
    const qty = Number.parseInt(quantityDraft, 10);
    if (Number.isNaN(qty) || qty < 0) {
      setEditingItemId(null);
      setQuantityDraft("");
      return;
    }

    setUpdatingItemId(editingItemId);
    setItemsError(null);

    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ quantity: qty })
        .eq("id", editingItemId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error("Error updating quantity:", error);
      setItemsError("Could not update the quantity. Please try again.");
    } finally {
      setUpdatingItemId(null);
      setEditingItemId(null);
      setQuantityDraft("");
    }
  };

  const inventoryCountSummary = useMemo(() => {
    if (!selectedUser) return "0 items tracked";
    const total = selectedUser.items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
    return `${selectedUser.items.length} items · ${total} total units`;
  }, [selectedUser]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F9FC] text-[#0B1B2B]">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#E2E8F0] bg-white/80 px-10 py-12 shadow-xl backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#17A2B8]/15 text-[#17A2B8]">
            <UserSquare2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <p className="text-lg font-semibold">Loading inventory tools…</p>
          <p className="text-sm text-[#1B2A38]/70">
            Securely verifying your workspace access.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1B2A38]">
      <header className="sticky top-0 z-50 bg-[#0B1B2B] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B2B] focus-visible:ring-white lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold tracking-tight">
                  BrokeNoMo
                </span>
                <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/80 sm:inline-flex">
                  Inventory
                </span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                Assign stocks to every users in one place.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B2B]"
              >
                <span className="hidden text-right text-xs font-medium leading-tight text-white/70 sm:block">
                  {user?.email || "Authenticated"}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#17A2B8]/20 text-white">
                  <UserSquare2 className="h-5 w-5" />
                </span>
              </button>
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-[#0B1B2B] shadow-xl backdrop-blur-xl"
                >
                  <div className="px-4 py-3 text-sm">
                    <p className="font-semibold">Inventory Console</p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email || "Secure session"}
                    </p>
                  </div>
                  <div className="border-t border-[#E2E8F0]/60 bg-[#F8FAFC] px-4 py-3">
                    <AuthButton className="w-full rounded-full bg-[#FF6B6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff5c5c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-72px)]">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-[#0B1B2B]/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 transform border-r border-white/10 bg-white/85 pb-8 pt-6 shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:flex lg:w-80 lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Inventory navigation"
        >
          <nav className="flex h-full w-full flex-col">
            <div className="px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0B1B2B]/60">
                Navigate
              </p>
              <ul className="mt-4 space-y-1">
                <li>
                  <Link
                    href="/dashboard"
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#1B2A38]/70 transition hover:bg-white hover:text-[#0B1B2B]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[#17A2B8] transition group-hover:bg-[#17A2B8]/10 group-hover:text-[#17A2B8]">
                      <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a
                    href="/dashboard#calendar"
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#1B2A38]/70 transition hover:bg-white hover:text-[#0B1B2B]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[#17A2B8] transition group-hover:bg-[#17A2B8]/10 group-hover:text-[#17A2B8]">
                      <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    Calendar
                  </a>
                </li>
                <li>
                  <span className="group flex items-center gap-3 rounded-2xl bg-[#0B1B2B] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(11,27,43,0.6)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[#17A2B8]">
                      <UserSquare2 className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    Inventory
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-10 flex-1 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0B1B2B]/70">
                  Users
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddingUser((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#17A2B8] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#13899a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Add User
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B2A38]/40" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search people"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-white/70 py-2 pl-10 pr-4 text-sm text-[#0B1B2B] shadow-sm transition placeholder:text-[#1B2A38]/40 focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30"
                />
              </div>

              {usersError && (
                <div className="mt-3 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-3 py-2 text-xs font-semibold text-[#9f2c2c] shadow-sm">
                  {usersError}
                </div>
              )}

              {isAddingUser && (
                <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-[#17A2B8]/40 bg-white/70 p-4 shadow-sm">
                  <div>
                    <label
                      htmlFor="new-user-name"
                      className="block text-xs font-medium uppercase tracking-[0.2em] text-[#1B2A38]/60"
                    >
                      Full name
                    </label>
                    <input
                      id="new-user-name"
                      type="text"
                      value={newUserName}
                      onChange={(event) => setNewUserName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0B1B2B] focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/25"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <p className="text-xs text-[#1B2A38]/60">
                    Each person you add is saved to the{" "}
                    <span className="font-semibold text-[#0B1B2B]">
                      inventory_users
                    </span>{" "}
                    table.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingUser(false);
                        setNewUserName("");
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#1B2A38]/60 hover:text-[#0B1B2B]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddUser}
                      disabled={savingUser || !newUserName.trim()}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        savingUser || !newUserName.trim()
                          ? "bg-[#A3CED6] text-white"
                          : "bg-[#17A2B8] text-white hover:bg-[#13899a] focus-visible:ring-[#17A2B8]/70"
                      )}
                    >
                      <UserPlus2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {savingUser ? "Saving…" : "Save user"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-2 overflow-y-auto pr-2">
                {usersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`inventory-user-skeleton-${index}`}
                        className="h-14 animate-pulse rounded-2xl bg-white/60"
                      />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 && !usersError ? (
                  <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white/80 p-6 text-center">
                    <p className="text-sm font-semibold text-[#0B1B2B]">
                      No users yet.
                    </p>
                    <p className="mt-1 text-xs text-[#1B2A38]/60">
                      Add one to get started!
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((person) => {
                    const initials = person.name
                      .split(" ")
                      .map((part) => part[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const isActive = selectedUserId === person.id;

                    return (
                      <div
                        key={person.id}
                        className={cn(
                          "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
                          isActive
                            ? "border-transparent bg-[#0B1B2B] text-white shadow-lg"
                            : "border-transparent bg-white/70 text-[#1B2A38] shadow-sm hover:border-[#17A2B8]/40 hover:bg-white"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectUser(person.id)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <span
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold",
                              person.accent,
                              isActive ? "text-white" : "text-white shadow-md"
                            )}
                          >
                            {initials}
                          </span>
                          <span>
                            {editingUserId === person.id ? (
                              <input
                                autoFocus
                                type="text"
                                value={userNameDraft}
                                onChange={(event) =>
                                  setUserNameDraft(event.target.value)
                                }
                                onBlur={handleCommitEditUser}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    handleCommitEditUser();
                                  }
                                  if (event.key === "Escape") {
                                    setEditingUserId(null);
                                    setUserNameDraft("");
                                  }
                                }}
                                className={cn(
                                  "w-full rounded-lg border px-2 py-1 text-sm",
                                  isActive
                                    ? "border-white/30 bg-white/10 text-white placeholder:text-white/50"
                                    : "border-[#E2E8F0] bg-white text-[#0B1B2B]"
                                )}
                              />
                            ) : (
                              <>
                                <span className="block text-sm font-semibold">
                                  {person.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    isActive
                                      ? "text-white/70"
                                      : "text-[#1B2A38]/60"
                                  )}
                                >
                                  Added {formatDisplayDate(person.createdAt)}
                                </span>
                              </>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editingUserId === person.id
                                ? handleCommitEditUser()
                                : handleStartEditUser(person.id, person.name)
                            }
                            disabled={savingUser && editingUserId !== person.id}
                            className={cn(
                              "rounded-full p-2 transition",
                              isActive
                                ? "text-white hover:bg-white/15"
                                : "text-[#1B2A38]/50 hover:bg-[#17A2B8]/10 hover:text-[#17A2B8]",
                              savingUser && editingUserId !== person.id
                                ? "pointer-events-none opacity-50"
                                : undefined
                            )}
                            aria-label="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(person.id)}
                            disabled={deletingUserId === person.id}
                            className={cn(
                              "rounded-full p-2 transition",
                              isActive
                                ? "text-white hover:bg-white/15"
                                : "text-[#1B2A38]/50 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]",
                              deletingUserId === person.id
                                ? "pointer-events-none opacity-50"
                                : undefined
                            )}
                            aria-label="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-10 sm:px-6 lg:px-12">
            <section className="rounded-3xl border border-[#E2E8F0] bg-white/85 p-6 shadow-[0_30px_60px_-40px_rgba(11,27,43,0.45)] backdrop-blur-xl lg:p-8">
              {selectedUser ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#17A2B8]">
                        Inventory for
                      </p>
                      <h1 className="mt-2 text-3xl font-semibold text-[#0B1B2B] sm:text-4xl">
                        {selectedUser.name}
                      </h1>
                      <p className="mt-2 flex items-center gap-2 text-sm text-[#1B2A38]/60">
                        <span className="inline-flex h-2 w-2 rounded-full bg-[#17A2B8]" />
                        {inventoryCountSummary}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white/80 px-4 py-2 text-sm font-semibold text-[#0B1B2B]/80 shadow-sm">
                        <Filter className="h-4 w-4" strokeWidth={2.2} />
                        <span>Sort</span>
                        <select
                          value={sortOption}
                          onChange={(event) =>
                            setSortOption(event.target.value as SortOption)
                          }
                          className="appearance-none bg-transparent text-sm font-semibold text-[#0B1B2B] focus:outline-none"
                        >
                          <option value="name-asc">Name · A → Z</option>
                          <option value="name-desc">Name · Z → A</option>
                          <option value="qty-desc">
                            Quantity · High → Low
                          </option>
                          <option value="qty-asc">Quantity · Low → High</option>
                        </select>
                        <span className="text-[#17A2B8]">{activeSortIcon}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingItem((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0B1B2B] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#11263b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {isAddingItem && (
                    <div className="rounded-2xl border border-dashed border-[#17A2B8]/40 bg-white/70 p-4 shadow-sm">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="new-item-name"
                            className="block text-xs font-medium uppercase tracking-[0.2em] text-[#1B2A38]/60"
                          >
                            Item name
                          </label>
                          <input
                            id="new-item-name"
                            type="text"
                            value={newItemName}
                            onChange={(event) =>
                              setNewItemName(event.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0B1B2B] focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20"
                            placeholder="Label printer"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="new-item-quantity"
                            className="block text-xs font-medium uppercase tracking-[0.2em] text-[#1B2A38]/60"
                          >
                            Quantity
                          </label>
                          <input
                            id="new-item-quantity"
                            type="number"
                            min={0}
                            value={newItemQuantity}
                            onChange={(event) =>
                              setNewItemQuantity(event.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0B1B2B] focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/20"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingItem(false);
                            setNewItemName("");
                            setNewItemQuantity("");
                          }}
                          className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#1B2A38]/60 hover:text-[#0B1B2B]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          disabled={!isItemFormValid || savingItem}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            !isItemFormValid || savingItem
                              ? "bg-[#A3CED6] text-white"
                              : "bg-[#17A2B8] text-white hover:bg-[#13899a] focus-visible:ring-[#17A2B8]/70"
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {savingItem ? "Saving…" : "Save item"}
                        </button>
                      </div>
                    </div>
                  )}

                  {itemsError && (
                    <div className="mb-4 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-4 py-3 text-sm font-semibold text-[#9f2c2c]">
                      {itemsError}
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#E2E8F0] bg-white/80 shadow-inner">
                    {sortedItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-4 px-8 py-16 text-center text-[#1B2A38]/60">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#17A2B8]/10 text-[#17A2B8]">
                          <Plus className="h-6 w-6" strokeWidth={2.3} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#0B1B2B]">
                            No items for this user.
                          </p>
                          <p className="mt-1 text-sm text-[#1B2A38]/60">
                            Add one now.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingItem(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#17A2B8] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#13899a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                          Add item
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <div className="hidden min-w-full overflow-x-auto md:block">
                          <table className="min-w-full divide-y divide-[#E2E8F0] text-sm">
                            <thead className="bg-[#F7FBFF] text-xs font-semibold uppercase tracking-[0.2em] text-[#1B2A38]/60">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left">
                                  Item name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left">
                                  Quantity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left">
                                  Added
                                </th>
                                <th scope="col" className="px-6 py-3" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]/60 bg-white/60">
                              {sortedItems.map((item) => {
                                const isEditing = editingItemId === item.id;
                                const quantityDisplay = isEditing
                                  ? quantityDraft
                                  : item.quantity;
                                const formattedDate = formatDisplayDate(
                                  item.createdAt
                                );

                                return (
                                  <tr
                                    key={item.id}
                                    className="transition hover:bg-[#F5F7FA]"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-semibold text-[#0B1B2B]">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-[#1B2A38]/60">
                                        {item.quantity} units assigned
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          min={0}
                                          autoFocus
                                          value={quantityDisplay}
                                          onChange={(event) =>
                                            setQuantityDraft(event.target.value)
                                          }
                                          onBlur={commitQuantityChange}
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                              commitQuantityChange();
                                            }
                                            if (event.key === "Escape") {
                                              setEditingItemId(null);
                                              setQuantityDraft("");
                                            }
                                          }}
                                          className="w-24 rounded-xl border border-[#17A2B8]/40 bg-[#17A2B8]/5 px-3 py-1 text-sm font-semibold text-[#0B1B2B] focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30"
                                        />
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartEditQuantity(
                                              item.id,
                                              item.quantity
                                            )
                                          }
                                          disabled={updatingItemId === item.id}
                                          className={cn(
                                            "rounded-full px-3 py-1 text-sm font-semibold text-[#0B1B2B] transition",
                                            updatingItemId === item.id
                                              ? "cursor-not-allowed bg-[#17A2B8]/10 opacity-60"
                                              : "bg-[#17A2B8]/10 hover:bg-[#17A2B8]/15"
                                          )}
                                        >
                                          {item.quantity}
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#1B2A38]/60">
                                      {formattedDate}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 text-[#1B2A38]/50">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartEditQuantity(
                                              item.id,
                                              item.quantity
                                            )
                                          }
                                          disabled={updatingItemId === item.id}
                                          className={cn(
                                            "rounded-full p-2 transition",
                                            updatingItemId === item.id
                                              ? "cursor-not-allowed opacity-50"
                                              : "hover:bg-[#17A2B8]/10 hover:text-[#17A2B8]"
                                          )}
                                          aria-label="Edit item"
                                        >
                                          <Pencil
                                            className="h-4 w-4"
                                            strokeWidth={2.2}
                                          />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteItem(item.id)
                                          }
                                          disabled={deletingItemId === item.id}
                                          className={cn(
                                            "rounded-full p-2 transition",
                                            deletingItemId === item.id
                                              ? "cursor-not-allowed opacity-50"
                                              : "hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]"
                                          )}
                                          aria-label="Delete item"
                                        >
                                          <Trash2
                                            className="h-4 w-4"
                                            strokeWidth={2.2}
                                          />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid gap-4 p-4 md:hidden">
                          {sortedItems.map((item) => {
                            const isEditing = editingItemId === item.id;
                            const formattedDate = formatDisplayDate(
                              item.createdAt
                            );

                            return (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white/70 p-4 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-[#0B1B2B]">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-[#1B2A38]/60">
                                      Added {formattedDate}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStartEditQuantity(
                                          item.id,
                                          item.quantity
                                        )
                                      }
                                      disabled={updatingItemId === item.id}
                                      className={cn(
                                        "rounded-full p-2 text-[#1B2A38]/50 transition",
                                        updatingItemId === item.id
                                          ? "cursor-not-allowed opacity-50"
                                          : "hover:bg-[#17A2B8]/10 hover:text-[#17A2B8]"
                                      )}
                                      aria-label="Edit item"
                                    >
                                      <Pencil
                                        className="h-4 w-4"
                                        strokeWidth={2.2}
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item.id)}
                                      disabled={deletingItemId === item.id}
                                      className={cn(
                                        "rounded-full p-2 text-[#1B2A38]/50 transition",
                                        deletingItemId === item.id
                                          ? "cursor-not-allowed opacity-50"
                                          : "hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]"
                                      )}
                                      aria-label="Delete item"
                                    >
                                      <Trash2
                                        className="h-4 w-4"
                                        strokeWidth={2.2}
                                      />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#1B2A38]/60">
                                    Quantity
                                  </p>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min={0}
                                      autoFocus
                                      value={quantityDraft}
                                      onChange={(event) =>
                                        setQuantityDraft(event.target.value)
                                      }
                                      onBlur={commitQuantityChange}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          commitQuantityChange();
                                        }
                                        if (event.key === "Escape") {
                                          setEditingItemId(null);
                                          setQuantityDraft("");
                                        }
                                      }}
                                      className="mt-2 w-24 rounded-xl border border-[#17A2B8]/40 bg-[#17A2B8]/5 px-3 py-1 text-sm font-semibold text-[#0B1B2B] focus:border-[#17A2B8] focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStartEditQuantity(
                                          item.id,
                                          item.quantity
                                        )
                                      }
                                      disabled={updatingItemId === item.id}
                                      className={cn(
                                        "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-[#0B1B2B] transition",
                                        updatingItemId === item.id
                                          ? "cursor-not-allowed bg-[#17A2B8]/10 opacity-60"
                                          : "bg-[#17A2B8]/10 hover:bg-[#17A2B8]/15"
                                      )}
                                    >
                                      {item.quantity}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 px-8 py-20 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#17A2B8]/15 text-[#17A2B8]">
                    <UserPlus2 className="h-8 w-8" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#0B1B2B]">
                      No users yet
                    </h2>
                    <p className="mt-2 text-sm text-[#1B2A38]/60">
                      Add a user from the left to begin managing their stocks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0B1B2B] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#11263b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Add user
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
