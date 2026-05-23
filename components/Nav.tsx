"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/",           label: "Dashboard"  },
  { href: "/pipeline",   label: "Pipeline"   },
  { href: "/companies",  label: "Companies"  },
  { href: "/network",    label: "Network"    },
  { href: "/content",    label: "Content"    },
  { href: "/resources",  label: "Resources"  },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-14">
          <span className="font-bold text-brand-700 text-lg mr-6">⚡ PM Career Ops</span>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                path === href
                  ? "bg-brand-100 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
