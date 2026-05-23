"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/",          label: "Dashboard" },
  { href: "/pipeline",  label: "Pipeline"  },
  { href: "/companies", label: "Companies" },
  { href: "/network",   label: "Network"   },
  { href: "/content",   label: "Content"   },
  { href: "/resources", label: "Resources" },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-14">
          <span className="font-bold text-brand-700 text-lg mr-4">⚡ PM Career Ops</span>
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  path === href ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          {user && (
            <div className="flex items-center gap-3 ml-3 shrink-0">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                {user.email?.[0]}
              </div>
              <button onClick={signOut} className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
