# Income Tracker

A simple, secure income & expense tracker built with Next.js (React) and Supabase. This MVP allows authenticated users to record daily incomes/expenses, view them on a calendar month, and get monthly summaries with CSV export functionality.

## Features

### MVP Goals (Must-Have)

- ✅ User authentication (email/password sign up + sign in)
- ✅ Calendar month view (Sun → Sat) that shows each day's net total
- ✅ Add income or expense per day (amount + optional note)
- ✅ Delete entries
- ✅ Monthly summary: Total Income, Total Expense, Profit = Income − Expense
- ✅ Persist data in a database (Supabase Postgres)
- ✅ CSV export for monthly data

### Advanced Features

- 📊 Beautiful calendar interface with daily totals
- 💰 Real-time monthly summary with profit/loss calculation
- 📱 Responsive design for mobile and desktop
- 🔒 Secure server-side API routes with Row Level Security
- 📈 Visual indicators for positive/negative daily totals
- 📄 CSV export with transaction details

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd Income-Tracker
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL schema from `src/lib/database/schema.sql`:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable email authentication
3. Configure your site URL (e.g., `http://localhost:3000` for development)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/                    # Server-side API routes
│   │   ├── transactions/      # Transaction CRUD operations
│   │   ├── summary/          # Monthly summary endpoint
│   │   ├── daily-totals/     # Daily totals for calendar
│   │   └── export/          # CSV export endpoint
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── landing/             # Landing page for unauthenticated users
│   └── page.tsx             # Main dashboard
├── components/
│   ├── auth/                # Authentication components
│   ├── calendar/            # Calendar component
│   ├── transactions/        # Transaction modal
│   └── summary/             # Monthly summary component
├── lib/
│   ├── supabase/            # Supabase client configuration
│   ├── types.ts             # TypeScript type definitions
│   └── database/            # Database schema
└── middleware.ts            # Authentication middleware
```

## API Endpoints

### Transactions

- `GET /api/transactions?month=1&year=2024` - Get transactions for a month
- `POST /api/transactions` - Create a new transaction
- `DELETE /api/transactions/[id]` - Delete a transaction

### Summary & Analytics

- `GET /api/summary?month=1&year=2024` - Get monthly summary
- `GET /api/daily-totals?month=1&year=2024` - Get daily totals for calendar
- `GET /api/export?month=1&year=2024` - Export monthly data as CSV

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Server-side API routes**: All database operations go through secure API endpoints
- **Authentication middleware**: Protects routes and ensures user authentication
- **Input validation**: Server-side validation for all user inputs

## Usage

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Access your dashboard
3. **Add Transactions**: Click on any day in the calendar to add income/expense entries
4. **View Summary**: See monthly totals, profit/loss, and transaction count
5. **Export Data**: Download monthly data as CSV for backup or analysis
6. **Navigate**: Use calendar navigation to view different months

## Development

### Key Components

- **Calendar**: Shows daily net totals with color coding
- **Transaction Modal**: Add/edit/delete transactions for specific dates
- **Monthly Summary**: Displays total income, expenses, and profit
- **CSV Export**: Downloads formatted transaction data

### Database Schema

The app uses a single `transactions` table with the following structure:

- `id`: UUID primary key
- `user_id`: References auth.users (with RLS)
- `date`: Transaction date
- `type`: 'income' or 'expense'
- `amount`: Decimal amount (positive)
- `note`: Optional transaction note
- `created_at`/`updated_at`: Timestamps

## Deployment

1. Deploy to Vercel, Netlify, or your preferred platform
2. Update environment variables in your deployment settings
3. Configure Supabase production settings
4. Update site URL in Supabase authentication settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.
