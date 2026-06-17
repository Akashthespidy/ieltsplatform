"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserSettingsAction, deleteUserAccountAction, exportUserDataAction } from "@/actions/settings";
import { useRouter } from "next/navigation";
import { Save, ShieldAlert, Download, Trash, Globe, CheckCircle, RefreshCw } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

// Validation schema using Zod
const settingsSchema = z.object({
  preferredLanguage: z.string().min(2, "Required"),
  target: z.string().min(2, "Required"),
  timezone: z.string().min(2, "Required"),
  country: z.string().min(2, "Required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsClient({
  user,
  dict,
}: {
  user: any;
  dict: any;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      preferredLanguage: user.preferredLanguage || "en",
      target: user.target || "IELTS",
      timezone: user.timezone || "UTC",
      country: user.country || "Bangladesh",
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateUserSettingsAction(values);
      if (res.success) {
        setSuccessMsg("Settings updated successfully!");
        // Refresh page to load new localization if language changed
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportUserDataAction();
      if (res.success && res.data) {
        // Trigger browser file download
        const blob = new Blob([res.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `linguatrack-export-${user.clerkId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert("Failed to export user data.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you sure you want to permanently delete your account? This action is irreversible.");
    if (!confirm) return;

    try {
      const res = await deleteUserAccountAction();
      if (res.success) {
        alert("Account deleted successfully.");
        await signOut();
        router.push("/");
      }
    } catch (e) {
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs sm:text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-xs sm:text-sm text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-500" />
          General Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Preferred Language */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Preferred Language</label>
            <select
              {...register("preferredLanguage")}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="es">Español (Spanish)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
            {errors.preferredLanguage && <span className="text-[10px] text-red-400">{errors.preferredLanguage.message}</span>}
          </div>

          {/* English Target */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">English Practice Target</label>
            <select
              {...register("target")}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="IELTS">IELTS Preparation</option>
              <option value="TOEFL">TOEFL Preparation</option>
              <option value="GRE">GRE Preparation</option>
              <option value="General English">General English</option>
              <option value="Business English">Business English</option>
            </select>
            {errors.target && <span className="text-[10px] text-red-400">{errors.target.message}</span>}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Timezone</label>
            <input
              type="text"
              {...register("timezone")}
              placeholder="e.g. UTC, Asia/Dhaka"
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-purple-500 transition-all"
            />
            {errors.timezone && <span className="text-[10px] text-red-400">{errors.timezone.message}</span>}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Country</label>
            <input
              type="text"
              {...register("country")}
              placeholder="e.g. Bangladesh, Japan"
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-purple-500 transition-all"
            />
            {errors.country && <span className="text-[10px] text-red-400">{errors.country.message}</span>}
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {dict.settings.save}
            </>
          )}
        </button>
      </form>

      {/* Advanced Security settings */}
      <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur">
        <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          Danger Zone & Security
        </h3>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-zinc-800 bg-zinc-950/40 rounded-2xl">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Export All Data</h4>
              <p className="text-xs text-zinc-500">Download a full JSON packet containing all reading, writing, and vocabulary scores.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download className="h-4 w-4" />
              {dict.settings.export}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-500/20 bg-red-950/5 rounded-2xl">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-300">Permanently Delete Account</h4>
              <p className="text-xs text-zinc-500">Completely remove your user record and delete active progress statistics from our servers.</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <Trash className="h-4 w-4" />
              {dict.settings.delete}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
