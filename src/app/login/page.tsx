import ModernAuthCard from "@/components/auth/ModernAuthCard";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const modeParam = resolvedParams.mode;
  const normalized = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  const initialMode = normalized === "signup" ? "signup" : "login";

  return <ModernAuthCard initialMode={initialMode} />;
}
