import { AppDataSource } from "../config/database";
import { User } from "../models/user";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";
import { SupportConversation } from "../models/supportConversation";
import { AiConversation } from "../models/aiConversation";
import USER_ROLE from "../enums/userRole.enum";
import SUPPORT_CONVERSATION_STATUS from "../enums/supportConversationStatus.enum";
import { Transaction } from "../models/transaction";
import { UserSubscription } from "../models/userSubscription";
import { Lesson } from "../models/lesson";
import { Roadmap } from "../models/roadmap";
import { MiniGame } from "../models/minigame";
import { Activity } from "../models/activity";
import { TRANSACTION_STATUS } from "../enums/transactionStatus.enum";

type StatsCard = {
  label: string;
  value: number;
  delta: string;
  deltaVariant: "text-success" | "text-danger" | "text-muted";
  icon: string;
  iconVariant: string;
  bgClass: string;
  prefix?: string;
  suffix?: string;
};

type RevenueDataset = {
  labels: string[];
  revenue: number[];
  profit: number[];
};

type RevenueDatasetMap = {
  "7d": RevenueDataset;
  "30d": RevenueDataset;
  "1y": RevenueDataset;
};


type UsageDataset = {
  labels: string[];
  aiConversations: number[];
  resolvedTickets: number[];
};

type UsageDatasetMap = {
  "7d": UsageDataset;
  "30d": UsageDataset;
  "1y": UsageDataset;
};

type UserGrowthDataset = {
  labels: string[];
  data: number[];
};

type OrderStatusDataset = {
  labels: string[];
  data: number[];
};

type RecentOrder = {
  id: string;
  customer: string;
  amount: string;
  status: { text: string; className: string };
  date: string;
};

type ActivityItem = {
  icon: string;
  iconVariant: string;
  bgClass: string;
  title: string;
  time: string;
};

type SalesByLocation = {
  name: string;
  value: number;
};

type StorageUsage = {
  used: number;
  total: number;
};

export type DashboardOverview = {
  statsCards: StatsCard[];
  revenueDataset: RevenueDatasetMap | RevenueDataset;
  userGrowthDataset: UserGrowthDataset;
  orderStatusDataset: OrderStatusDataset;
  recentOrders: RecentOrder[];
  activityFeed: ActivityItem[];
  storageUsage: StorageUsage;
  salesByLocation: SalesByLocation[];
  contentStats: {
    lessons: number;
    roadmaps: number;
    minigames: number;
    activities: number;
  };
  usageDataset: UsageDatasetMap | UsageDataset;
  subscriptionDistribution: {
    labels: string[];
    data: number[];
  };
  monthlyRevenue: {
    month: string;
    revenue: number;
    transactions: number;
    growth: string;
  }[];
  recentTickets: {
    id: string;
    customer: string;
    status: string;
    date: string;
  }[];
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const safePercentage = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
};

const dateToLabel = (date: Date) => {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
};

export class DashboardService {
  async getOverview(): Promise<DashboardOverview> {
    const userRepo = AppDataSource.getRepository(User);
    const enrollmentRepo = AppDataSource.getRepository(RoadmapEnrollment);
    const supportRepo = AppDataSource.getRepository(SupportConversation);
    const aiConvRepo = AppDataSource.getRepository(AiConversation);
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const subscriptionRepo = AppDataSource.getRepository(UserSubscription);
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const roadmapRepo = AppDataSource.getRepository(Roadmap);
    const minigameRepo = AppDataSource.getRepository(MiniGame);
    const activityRepo = AppDataSource.getRepository(Activity);

    const [
      totalUsers,
      staffTotal,
      activeEnrollments,
      openTickets,
      totalRevenueRaw,
      activeSubscriptions,
      lessonsCount,
      roadmapsCount,
      minigamesCount,
      activitiesCount
    ] = await Promise.all([
      userRepo.count(),
      userRepo.count({ where: { role: USER_ROLE.STAFF } }),
      enrollmentRepo.count({ where: { status: "active" as any } }),
      supportRepo.count({ where: { status: SUPPORT_CONVERSATION_STATUS.OPEN } }),
      transactionRepo
        .createQueryBuilder("t")
        .select("SUM(t.amount)", "sum")
        .where("t.status = :status", { status: TRANSACTION_STATUS.SUCCESS })
        .getRawOne<{ sum: string }>(),
      subscriptionRepo.count({ where: { isActive: true } }),
      lessonRepo.count(),
      roadmapRepo.count(),
      minigameRepo.count(),
      activityRepo.count()
    ]);

    const totalRevenue = Number(totalRevenueRaw?.sum || 0);

    const statsCards: StatsCard[] = [
      {
        label: "Total Revenue",
        value: totalRevenue,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-currency-dollar",
        iconVariant: "text-primary",
        bgClass: "bg-primary",
        suffix: " VNĐ"
      },
      {
        label: "Total Users",
        value: totalUsers,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-people",
        iconVariant: "text-info",
        bgClass: "bg-info"
      },
      {
        label: "Active Subscriptions",
        value: activeSubscriptions,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-patch-check",
        iconVariant: "text-success",
        bgClass: "bg-success"
      },
      {
        label: "Support Tickets",
        value: openTickets,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-life-preserver",
        iconVariant: "text-warning",
        bgClass: "bg-warning"
      }
    ];

    const now = new Date();
    const sixMonthsWindow = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + idx, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return { key, label: monthLabels[d.getMonth()] };
    });

    const startSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const revenueByMonthRaw = await transactionRepo
      .createQueryBuilder("t")
      .select("YEAR(t.createdAt)", "y")
      .addSelect("MONTH(t.createdAt)", "m")
      .addSelect("SUM(t.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("t.status = :status", { status: TRANSACTION_STATUS.SUCCESS })
      .andWhere("t.createdAt >= :from", { from: startSixMonths })
      .groupBy("YEAR(t.createdAt)")
      .addGroupBy("MONTH(t.createdAt)")
      .orderBy("YEAR(t.createdAt)", "ASC")
      .addOrderBy("MONTH(t.createdAt)", "ASC")
      .getRawMany<{ y: number; m: number; total: string; count: string }>();

    const revenueMap = new Map<string, { total: number, count: number }>();
    revenueByMonthRaw.forEach((row) => {
      // Robust key construction handling both numbers and strings
      const y = row.y.toString();
      const m = row.m.toString().padStart(2, "0");
      const key = `${y}-${m}`;
      revenueMap.set(key, { total: Number(row.total || 0), count: Number(row.count || 0) });
    });



    const monthlyRevenue = sixMonthsWindow.map((m, idx) => {
      const current = revenueMap.get(m.key) || { total: 0, count: 0 };
      let growth = "0.0%";
      if (idx > 0) {
        const prev = revenueMap.get(sixMonthsWindow[idx - 1].key) || { total: 0, count: 0 };
        if (prev.total > 0) {
          const change = ((current.total - prev.total) / prev.total) * 100;
          growth = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
        } else if (current.total > 0) {
          growth = "+100%";
        }
      }
      return {
        month: m.label,
        revenue: current.total,
        transactions: current.count,
        growth
      };
    });

    const start90Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    const revenueByDayRaw = await transactionRepo
      .createQueryBuilder("t")
      .select("DATE(t.createdAt)", "d")
      .addSelect("SUM(t.amount)", "total")
      .where("t.status = :status", { status: TRANSACTION_STATUS.SUCCESS })
      .andWhere("t.createdAt >= :from", { from: start90Days })
      .groupBy("DATE(t.createdAt)")
      .orderBy("DATE(t.createdAt)", "ASC")
      .getRawMany<{ d: Date; total: string }>();

    const dailyRevenueMap = new Map<string, number>();
    revenueByDayRaw.forEach((row) => {
      // In MySQL/TypeORM, DATE() might return a string or Date object depending on driver
      const dateObj = new Date(row.d);
      const key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;
      dailyRevenueMap.set(key, Number(row.total || 0));
    });

    const generateDailyDataset = (days: number): RevenueDataset => {
      const labels: string[] = [];
      const revenue: number[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        labels.push(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`);
        revenue.push(dailyRevenueMap.get(key) || 0);
      }
      return { labels, revenue, profit: [] };
    };

    const start12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const revenueByMonth12Raw = await transactionRepo
      .createQueryBuilder("t")
      .select("YEAR(t.createdAt)", "y")
      .addSelect("MONTH(t.createdAt)", "m")
      .addSelect("SUM(t.amount)", "total")
      .where("t.status = :status", { status: TRANSACTION_STATUS.SUCCESS })
      .andWhere("t.createdAt >= :from", { from: start12Months })
      .groupBy("YEAR(t.createdAt)")
      .addGroupBy("MONTH(t.createdAt)")
      .orderBy("YEAR(t.createdAt)", "ASC")
      .addOrderBy("MONTH(t.createdAt)", "ASC")
      .getRawMany<{ y: number; m: number; total: string }>();

    const monthlyRevenueMap12 = new Map<string, number>();
    revenueByMonth12Raw.forEach((row) => {
      const key = `${row.y}-${row.m.toString().padStart(2, "0")}`;
      monthlyRevenueMap12.set(key, Number(row.total || 0));
    });

    const labels1y: string[] = [];
    const revenue1y: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      labels1y.push(monthLabels[d.getMonth()]);
      revenue1y.push(monthlyRevenueMap12.get(key) || 0);
    }

    const revenueDatasetMap: RevenueDatasetMap = {
      "7d": generateDailyDataset(7),
      "30d": generateDailyDataset(30),
      "1y": { labels: labels1y, revenue: revenue1y, profit: [] }
    };

    const start30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const aiByDayRaw = await aiConvRepo
      .createQueryBuilder("conv")
      .select("DATE(conv.createdAt)", "d")
      .addSelect("COUNT(*)", "total")
      .where("conv.createdAt >= :from", { from: start30Days })
      .groupBy("DATE(conv.createdAt)")
      .orderBy("DATE(conv.createdAt)", "ASC")
      .getRawMany<{ d: Date; total: string }>();

    const dailyAiMap = new Map<string, number>();
    aiByDayRaw.forEach((row) => {
      const dateObj = new Date(row.d);
      const key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;
      dailyAiMap.set(key, Number(row.total || 0));
    });

    const generateDailyUsageDataset = (days: number): UsageDataset => {
      const labels: string[] = [];
      const aiConversations: number[] = [];
      const resolvedTickets: number[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        labels.push(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`);
        aiConversations.push(dailyAiMap.get(key) || 0);
        resolvedTickets.push(Math.floor(Math.random() * 50)); // Mocking data as requested
      }
      return { labels, aiConversations, resolvedTickets };
    };

    const aiByMonth12Raw = await aiConvRepo
      .createQueryBuilder("conv")
      .select("YEAR(conv.createdAt)", "y")
      .addSelect("MONTH(conv.createdAt)", "m")
      .addSelect("COUNT(*)", "total")
      .where("conv.createdAt >= :from", { from: start12Months })
      .groupBy("YEAR(conv.createdAt)")
      .addGroupBy("MONTH(conv.createdAt)")
      .orderBy("YEAR(conv.createdAt)", "ASC")
      .addOrderBy("MONTH(conv.createdAt)", "ASC")
      .getRawMany<{ y: number; m: number; total: string }>();

    const monthlyAiMap12 = new Map<string, number>();
    aiByMonth12Raw.forEach((row) => {
      const key = `${row.y}-${row.m.toString().padStart(2, "0")}`;
      monthlyAiMap12.set(key, Number(row.total));
    });

    const ai1y: number[] = [];
    const tickets1y: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      ai1y.push(monthlyAiMap12.get(key) || 0);
      tickets1y.push(Math.floor(Math.random() * 50)); // Mocking data
    }

    const usageDatasetMap: UsageDatasetMap = {
      "7d": generateDailyUsageDataset(7),
      "30d": generateDailyUsageDataset(30),
      "1y": { labels: labels1y, aiConversations: ai1y, resolvedTickets: tickets1y }
    };

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);
    const userGrowthRaw = await userRepo
      .createQueryBuilder("user")
      .select("DATE(user.startedAt)", "day")
      .addSelect("COUNT(*)", "total")
      .where("user.startedAt >= :from", { from: fourteenDaysAgo })
      .groupBy("DATE(user.startedAt)")
      .orderBy("DATE(user.startedAt)", "ASC")
      .getRawMany<{ day: string; total: string }>();

    const growthMap = new Map<string, number>();
    userGrowthRaw.forEach((row) => growthMap.set(row.day, Number(row.total)));

    const userGrowthLabels: string[] = [];
    const userGrowthData: number[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(fourteenDaysAgo.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      userGrowthLabels.push(dateToLabel(d));
      userGrowthData.push(growthMap.get(key) ?? 0);
    }

    const userGrowthDataset: UserGrowthDataset = {
      labels: userGrowthLabels,
      data: userGrowthData
    };

    const supportStatusCountsRaw = await supportRepo
      .createQueryBuilder("c")
      .select("c.status", "status")
      .addSelect("COUNT(*)", "total")
      .groupBy("c.status")
      .getRawMany<{ status: SUPPORT_CONVERSATION_STATUS; total: string }>();

    const statusMap = new Map<SUPPORT_CONVERSATION_STATUS, number>();
    supportStatusCountsRaw.forEach((row) => statusMap.set(row.status, Number(row.total)));

    const orderStatusDataset: OrderStatusDataset = {
      labels: ["Completed", "Processing", "Pending", "Cancelled"],
      data: [
        statusMap.get(SUPPORT_CONVERSATION_STATUS.RESOLVED) ?? 0,
        statusMap.get(SUPPORT_CONVERSATION_STATUS.OPEN) ?? 0,
        statusMap.get(SUPPORT_CONVERSATION_STATUS.OPEN) ?? 0,
        statusMap.get(SUPPORT_CONVERSATION_STATUS.CLOSED) ?? 0
      ]
    };

    const recentTransactions = await transactionRepo.find({
      relations: { user: true, package: true },
      order: { createdAt: "DESC" },
      take: 6
    });

    const transactionStatusBadge = (status: TRANSACTION_STATUS) => {
      switch (status) {
        case TRANSACTION_STATUS.SUCCESS:
          return { text: "Success", className: "bg-success" };
        case TRANSACTION_STATUS.PENDING:
          return { text: "Pending", className: "bg-warning" };
        case TRANSACTION_STATUS.FAILED:
          return { text: "Failed", className: "bg-danger" };
        default:
          return { text: status, className: "bg-secondary" };
      }
    };

    const recentOrders: RecentOrder[] = recentTransactions.map((tx) => ({
      id: `#${tx.id.slice(0, 8)}`,
      customer: tx.user?.name ?? "Unknown",
      amount: `${Number(tx.amount).toLocaleString()} VNĐ`,
      status: transactionStatusBadge(tx.status),
      date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("vi-VN") : ""
    }));

    const recentSupport = await supportRepo.find({
      relations: { customer: true },
      order: { createdAt: "DESC" },
      take: 6
    });

    const recentTickets = recentSupport.map((s) => ({
      id: `#${s.id}`,
      customer: s.customer?.name ?? "Guest",
      status: s.status,
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("vi-VN") : ""
    }));

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newUsersToday = await userRepo
      .createQueryBuilder("u")
      .where("u.startedAt >= :start", { start: startOfToday })
      .getCount();

    const newTicketsToday = await supportRepo
      .createQueryBuilder("c")
      .where("c.createdAt >= :start", { start: startOfToday })
      .getCount();

    const aiLast24h = await aiConvRepo
      .createQueryBuilder("conv")
      .where("conv.createdAt >= :start", { start: startOfToday })
      .getCount();

    const activityFeed: ActivityItem[] = [
      {
        icon: "bi-person-plus",
        iconVariant: "text-primary",
        bgClass: "bg-primary",
        title: `${newUsersToday} người dùng mới trong ngày`,
        time: "Hôm nay"
      },
      {
        icon: "bi-chat-dots",
        iconVariant: "text-success",
        bgClass: "bg-success",
        title: `${newTicketsToday} ticket hỗ trợ mở mới hôm nay`,
        time: "Hôm nay"
      },
      {
        icon: "bi-cpu",
        iconVariant: "text-info",
        bgClass: "bg-info",
        title: `${aiLast24h} phiên AI trong 24h`,
        time: "24h qua"
      }
    ];

    const totalTickets = Array.from(statusMap.values()).reduce((a, b) => a + b, 0);
    const resolved = statusMap.get(SUPPORT_CONVERSATION_STATUS.RESOLVED) ?? 0;
    const storageUsage: StorageUsage = {
      used: safePercentage(resolved, totalTickets || 1),
      total: 100
    };

    const roadmapUsageRaw = await enrollmentRepo
      .createQueryBuilder("enroll")
      .leftJoin("enroll.roadmap", "roadmap")
      .select("roadmap.levelName", "name")
      .addSelect("COUNT(*)", "total")
      .groupBy("roadmap.levelName")
      .orderBy("COUNT(*)", "DESC")
      .limit(6)
      .getRawMany<{ name: string; total: string }>();

    const salesByLocation: SalesByLocation[] = roadmapUsageRaw.map((row) => ({
      name: row.name ?? "Roadmap",
      value: Number(row.total)
    }));

    const subscriptionCountsRaw = await subscriptionRepo
      .createQueryBuilder("s")
      .leftJoin("s.package", "p")
      .select("p.type", "type")
      .addSelect("COUNT(*)", "total")
      .where("s.isActive = :isActive", { isActive: true })
      .groupBy("p.type")
      .getRawMany<{ type: string; total: string }>();

    const typeLabels: Record<string, string> = {
      AI_CONVERSATION: "AI Conversation",
      ROADMAP_UNLOCK: "Roadmap Unlock",
      VIDEO_LESSON: "Video Lesson",
      GRAMMAR_CHECKER: "Grammar Checker"
    };

    const subscriptionDistribution = {
      labels: subscriptionCountsRaw.map((row) => typeLabels[row.type] || row.type || "Other"),
      data: subscriptionCountsRaw.map((row) => Number(row.total))
    };

    const ensureDataset = <T>(items: T[], fallback: T[]) => (items.length > 0 ? items : fallback);

    return {
      statsCards,
      revenueDataset: revenueDatasetMap,
      userGrowthDataset,
      orderStatusDataset,
      recentOrders: ensureDataset(recentOrders, []),
      activityFeed,
      storageUsage,
      salesByLocation: ensureDataset(salesByLocation, [{ name: "Roadmap", value: 0 }]),
      contentStats: {
        lessons: lessonsCount,
        roadmaps: roadmapsCount,
        minigames: minigamesCount,
        activities: activitiesCount
      },
      subscriptionDistribution,
      monthlyRevenue,
      usageDataset: usageDatasetMap,
      recentTickets
    };
  }

  async getAllTransactions() {
    const transactionRepo = AppDataSource.getRepository(Transaction);
    return await transactionRepo.find({
      relations: { user: true, package: true },
      order: { createdAt: "DESC" }
    });
  }

  async getAllSubscriptions() {
    const subscriptionRepo = AppDataSource.getRepository(UserSubscription);
    return await subscriptionRepo.find({
      relations: { user: true, package: true },
      order: { createdAt: "DESC" }
    });
  }

  async getTopCustomers() {
    const transactionRepo = AppDataSource.getRepository(Transaction);
    // Query to sum amount per user for SUCCESS transactions
    const topSpenders = await transactionRepo
      .createQueryBuilder("transaction")
      .leftJoin("transaction.user", "user")
      .select("user.id", "id")
      .addSelect("user.name", "name")
      .addSelect("user.email", "email")
      .addSelect("user.avatarUrl", "avatarUrl")
      .addSelect("SUM(transaction.amount)", "totalSpent")
      .where("transaction.status = :status", { status: "SUCCESS" })
      .groupBy("user.id")
      .orderBy("totalSpent", "DESC")
      .limit(10)
      .getRawMany();

    return topSpenders;
  }
}

export const dashboardService = new DashboardService();