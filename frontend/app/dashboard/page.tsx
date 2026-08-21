"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HeroSection from "@/components/dashboard/HeroSection";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import NetworkStatus from "@/components/dashboard/NetworkStatus";
import WelcomeModal from "@/components/dashboard/WelcomeModal";

import { Users } from "lucide-react";

import useAuth from "@/hooks/useAuth";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "URGENT";
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] =
    useState(false);

  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);

  const [announcementLoading, setAnnouncementLoading] =
    useState(true);

  const { user, loading } = useAuth();

  // =====================================================
  // LOAD ACTIVE ANNOUNCEMENT
  // =====================================================

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setAnnouncementLoading(true);

        const response = await fetch(
          `${API_URL}/announcements`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to load announcements."
          );
        }

        const announcements: Announcement[] =
          result.announcements || [];

        // =================================================
        // FIND CURRENTLY VALID ACTIVE ANNOUNCEMENT
        // =================================================

        const now = new Date();

        const activeAnnouncement =
          announcements.find((item) => {
            // Must be active
            if (!item.isActive) {
              return false;
            }

            // Check start date
            if (item.startDate) {
              const startDate =
                new Date(item.startDate);

              if (now < startDate) {
                return false;
              }
            }

            // Check end date
            if (item.endDate) {
              const endDate =
                new Date(item.endDate);

              // Make end date inclusive
              endDate.setHours(
                23,
                59,
                59,
                999
              );

              if (now > endDate) {
                return false;
              }
            }

            return true;
          });

        if (activeAnnouncement) {
          setAnnouncement(
            activeAnnouncement
          );

          // =================================================
          // SHOW ONLY ONCE PER ANNOUNCEMENT
          // =================================================

          const seenKey =
            `abupay-announcement-seen-${activeAnnouncement._id}`;

          const alreadySeen =
            localStorage.getItem(
              seenKey
            );

          if (!alreadySeen) {
            setShowWelcome(true);
          }
        } else {
          setAnnouncement(null);
          setShowWelcome(false);
        }
      } catch (error) {
        console.error(
          "Announcement loading error:",
          error
        );

        setAnnouncement(null);
        setShowWelcome(false);
      } finally {
        setAnnouncementLoading(false);
      }
    };

    loadAnnouncement();
  }, []);

  // =====================================================
  // CLOSE ANNOUNCEMENT
  // =====================================================

  const handleCloseAnnouncement = () => {
    if (announcement?._id) {
      const seenKey =
        `abupay-announcement-seen-${announcement._id}`;

      localStorage.setItem(
        seenKey,
        "true"
      );
    }

    setShowWelcome(false);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />

            <p className="mt-4 text-gray-500">
              Loading AbuPay...
            </p>

          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <>
      {/* =================================================
          ANNOUNCEMENT POPUP
      ================================================= */}

      {!announcementLoading && (
        <WelcomeModal
          open={showWelcome}
          userName={
            user?.name ||
            "AbuPay User"
          }
          announcement={
            announcement
          }
          onClose={
            handleCloseAnnouncement
          }
        />
      )}

      <DashboardLayout>
        <div className="space-y-6">

          {/* =================================================
              HERO SECTION
          ================================================= */}

          <HeroSection />

          {/* =================================================
              REFERRALS
              
              No earnings.
              No rewards.
              Just records the number of customers
              referred by this customer.
          ================================================= */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Referrals"
              value={
                user?.referralCount ?? 0
              }
              icon={Users}
              color="bg-purple-500"
            />

          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <QuickActions />

          {/* =================================================
              STATISTICS + NETWORK
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-3">

            <div className="lg:col-span-2">
              <StatisticsChart />
            </div>

            <NetworkStatus />

          </div>

          {/* =================================================
              AVAILABLE SERVICES
          ================================================= */}

          <ServicesGrid />

          {/* =================================================
              RECENT TRANSACTIONS
          ================================================= */}

          <TransactionsTable />

        </div>
      </DashboardLayout>
    </>
  );
}