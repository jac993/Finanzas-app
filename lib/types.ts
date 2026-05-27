export type AccountType = "checking" | "savings" | "cash" | "credit";
export type CategoryType = "expense" | "income" | "investment";
export type TransactionType = "expense" | "income" | "investment";
export type TransactionSource = "manual" | "csv";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  source: TransactionSource;
  created_at: string;
};

export type TransactionWithRelations = Transaction & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  account: Pick<Account, "id" | "name"> | null;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
};

export type MetricWithChange = {
  current: number;
  previous: number;
  changePercent: number;
};

export type DashboardMetrics = {
  totalBalance: MetricWithChange;
  monthlyExpenses: MetricWithChange;
  monthlyIncome: MetricWithChange;
  monthlySavings: MetricWithChange;
};

export type MonthlyIncomeExpense = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

export type CategoryExpense = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
};

export type BudgetProgress = {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
};

export type BudgetPageItem = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetId: string | null;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
  difference: number;
};

export type CategoryInput = {
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
};

export type AccountInput = {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
};

export type UserProfile = {
  email: string;
  name: string | null;
};

export type SettingsPageData = {
  profile: UserProfile;
  accounts: Account[];
  categories: Category[];
};

export type TransactionFilters = {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  type?: TransactionType;
  accountId?: string;
  search?: string;
};

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string | null;
  accountId: string | null;
  date: string;
};

export type CsvTransactionRow = {
  date: string;
  amount: number;
  description: string;
};

export type ImportCsvInput = {
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  rows: CsvTransactionRow[];
};

export type AnalyticsRange = 3 | 6 | 12;

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  initial_amount: number;
  current_amount: number;
  currency: string;
  started_at: string | null;
  created_at: string;
};

export type InvestmentType = "fund" | "deposit" | "currency" | "stock" | "other";

export type InvestmentInput = {
  name: string;
  type: InvestmentType;
  initialAmount: number;
  currentAmount: number;
  currency: string;
  startedAt: string | null;
};

export type InvestmentListItem = {
  id: string;
  name: string;
  type: InvestmentType;
  initialAmount: number;
  currentAmount: number;
  currency: string;
  startedAt: string | null;
  totalReturn: number;
  returnPercent: number;
  growthProgress: number;
};

export type InvestmentsSummary = {
  totalInvested: number;
  totalCurrent: number;
  totalReturn: number;
  bestInvestment: { name: string; returnPercent: number } | null;
};

export type InvestmentsPageData = {
  summary: InvestmentsSummary;
  items: InvestmentListItem[];
};

export type AnalyticsQuickMetrics = {
  totalExpensesCurrentMonth: number;
  topCategory: { name: string; icon: string; amount: number } | null;
  fastestGrowingCategory: { name: string; icon: string; changePercent: number } | null;
  netSavings: number;
};

export type CategoryAlert = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  deviationPercent: number;
  currentAmount: number;
  averageAmount: number;
};

export type StackedCategorySeries = {
  categoryId: string;
  name: string;
  color: string;
};

export type StackedMonthPoint = {
  monthKey: string;
  label: string;
  isCurrent: boolean;
  total: number;
  segments: Record<string, number>;
};

export type CategoryComparisonRow = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  monthlyAmounts: number[];
  monthLabels: string[];
  trend: "up" | "down" | "stable";
  variationPercent: number;
};

export type InvestmentAnalyticsItem = {
  id: string;
  name: string;
  type: Investment["type"];
  initialAmount: number;
  currentAmount: number;
  totalReturn: number;
  returnPercent: number;
  monthlyChange: number;
};

export type AnalyticsData = {
  range: AnalyticsRange;
  quickMetrics: AnalyticsQuickMetrics;
  alerts: CategoryAlert[];
  stackedChart: {
    series: StackedCategorySeries[];
    points: StackedMonthPoint[];
  };
  comparisonRows: CategoryComparisonRow[];
  monthTotals: number[];
  monthLabels: string[];
  investments: InvestmentAnalyticsItem[];
  investmentMonthlyFlow: number;
};
