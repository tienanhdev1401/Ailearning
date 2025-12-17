import { AppDataSource } from "../config/database";
import { User } from "../models/user";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";
import { SupportConversation } from "../models/supportConversation";
import { AiConversation } from "../models/aiConversation";
import USER_ROLE from "../enums/userRole.enum";
import SUPPORT_CONVERSATION_STATUS from "../enums/supportConversationStatus.enum";

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
  revenueDataset: RevenueDataset;
  userGrowthDataset: UserGrowthDataset;
  orderStatusDataset: OrderStatusDataset;
  recentOrders: RecentOrder[];
  activityFeed: ActivityItem[];
  storageUsage: StorageUsage;
  salesByLocation: SalesByLocation[];
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
    const [totalUsers, staffTotal, activeEnrollments, openTickets] = await Promise.all([
      userRepo.count(),
      userRepo.count({ where: { role: USER_ROLE.STAFF } }),
      enrollmentRepo.count({ where: { status: "active" as any } }),
      supportRepo.count({ where: { status: SUPPORT_CONVERSATION_STATUS.OPEN } })
    ]);

    const statsCards: StatsCard[] = [
      {
        label: "Total Users",
        value: totalUsers,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-people",
        iconVariant: "text-primary",
        bgClass: "bg-primary"
      },
      {
        label: "Active Learners",
        value: activeEnrollments,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-mortarboard",
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
      },
      {
        label: "Staff",
        value: staffTotal,
        delta: "+0.0%",
        deltaVariant: "text-muted",
        icon: "bi-person-workspace",
        iconVariant: "text-info",
        bgClass: "bg-info"
      }
    ];

    const now = new Date();
    const sixMonthsWindow = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + idx, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return { key, label: monthLabels[d.getMonth()] };
    });

    const startSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const aiByMonthRaw = await aiConvRepo
      .createQueryBuilder("conv")
      .select("YEAR(conv.createdAt)", "y")
      .addSelect("MONTH(conv.createdAt)", "m")
      .addSelect("COUNT(*)", "total")
      .where("conv.createdAt >= :from", { from: startSixMonths })
      .groupBy("YEAR(conv.createdAt)")
      .addGroupBy("MONTH(conv.createdAt)")
      .orderBy("YEAR(conv.createdAt)", "ASC")
      .addOrderBy("MONTH(conv.createdAt)", "ASC")
      .getRawMany<{ y: number; m: number; total: string }>();

    const aiMap = new Map<string, number>();
    aiByMonthRaw.forEach((row) => {
      const key = `${row.y}-${row.m.toString().padStart(2, "0")}`;
      aiMap.set(key, Number(row.total));
    });

    const supportResolvedRaw = await supportRepo
      .createQueryBuilder("c")
      .select("YEAR(c.resolvedAt)", "y")
      .addSelect("MONTH(c.resolvedAt)", "m")
      .addSelect("COUNT(*)", "total")
      .where("c.resolvedAt IS NOT NULL")
      .andWhere("c.resolvedAt >= :from", { from: startSixMonths })
      .groupBy("YEAR(c.resolvedAt)")
      .addGroupBy("MONTH(c.resolvedAt)")
      .orderBy("YEAR(c.resolvedAt)", "ASC")
      .addOrderBy("MONTH(c.resolvedAt)", "ASC")
      .getRawMany<{ y: number; m: number; total: string }>();

    const supportResolvedMap = new Map<string, number>();
    supportResolvedRaw.forEach((row) => {
      const key = `${row.y}-${row.m.toString().padStart(2, "0")}`;
      supportResolvedMap.set(key, Number(row.total));
    });

    const revenueDataset: RevenueDataset = {
      labels: sixMonthsWindow.map((m) => m.label),
      revenue: sixMonthsWindow.map((m) => aiMap.get(m.key) ?? 0),
      profit: sixMonthsWindow.map((m) => supportResolvedMap.get(m.key) ?? 0)
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

    const recentConversations = await supportRepo.find({
      relations: { customer: true },
      order: { createdAt: "DESC" },
      take: 6
    });

    const statusBadge = (status: SUPPORT_CONVERSATION_STATUS) => {
      switch (status) {
        case SUPPORT_CONVERSATION_STATUS.OPEN:
          return { text: "Open", className: "bg-warning" };
        case SUPPORT_CONVERSATION_STATUS.RESOLVED:
          return { text: "Resolved", className: "bg-success" };
        case SUPPORT_CONVERSATION_STATUS.CLOSED:
          return { text: "Closed", className: "bg-secondary" };
        default:
          return { text: status, className: "bg-secondary" };
      }
    };

    const recentOrders: RecentOrder[] = recentConversations.map((conv) => ({
      id: `#${conv.id}`,
      customer: conv.customer?.name ?? "Unknown",
      amount: "—",
      status: statusBadge(conv.status),
      date: conv.createdAt ? new Date(conv.createdAt).toLocaleDateString("vi-VN") : ""
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

    const ensureDataset = <T>(items: T[], fallback: T[]) => (items.length > 0 ? items : fallback);

    return {
      statsCards,
      revenueDataset: ensureDataset(revenueDataset.labels, []).length ? revenueDataset : {
        labels: monthLabels.slice(0, 6),
        revenue: Array(6).fill(0),
        profit: Array(6).fill(0)
      },
      userGrowthDataset,
      orderStatusDataset,
      recentOrders: ensureDataset(recentOrders, []),
      activityFeed,
      storageUsage,
      salesByLocation: ensureDataset(salesByLocation, [{ name: "Roadmap", value: 0 }])
    };
  }
}

export const dashboardService = new DashboardService();