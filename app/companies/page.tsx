import Link from "next/link";
import applications from "@/data/applications.json";

export default function Companies() {
  const companies = Array.from(new Map(applications.map((a) => [a.company, a])).values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Research Hub</h1>
        <p className="text-slate-500 text-sm mt-1">
          Deep analysis for every company in your pipeline. These become blog posts too.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <div key={c.company} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="font-bold text-slate-900">{c.company}</h2>
                <p className="text-xs text-slate-400">{c.role}</p>
              </div>
              <span className={`badge ${c.priority === "High" ? "bg-red-100 text-red-700 border border-red-200" : c.priority === "Medium" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                {c.priority}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.notes}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {c.atsKeywords.slice(0, 3).map((kw) => (
                <span key={kw} className="badge bg-blue-50 text-blue-600">{kw}</span>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 mt-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Research Checklist</p>
              <ul className="text-xs text-slate-600 space-y-1">
                {[
                  "Product overview & core user flow",
                  "Onboarding analysis",
                  "3 PM improvements",
                  "Business model",
                  "Competitors",
                  "AI opportunities",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border border-slate-300 inline-block shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <div className="card border-dashed border-slate-300 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="text-center text-slate-400">
            <p className="text-2xl mb-1">+</p>
            <p className="text-sm font-medium">Add Company</p>
            <p className="text-xs">Update data/applications.json</p>
          </div>
        </div>
      </div>

      {/* Research Framework */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Standard Research Framework</h2>
        <p className="text-sm text-slate-500 mb-4">
          Use this for every company. Output becomes your interview prep AND a blog post draft.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            {
              section: "1. Company Overview",
              items: ["Mission & vision", "Funding stage & size", "Revenue model", "Key metrics (DAU, ARR, etc.)"],
            },
            {
              section: "2. Product Analysis",
              items: ["Core product loop", "Primary user persona", "Key features", "What makes it sticky"],
            },
            {
              section: "3. Onboarding Audit",
              items: ["First 5 minutes", "Activation moment (aha!)", "Friction points", "Drop-off risks"],
            },
            {
              section: "4. SWOT",
              items: ["Strengths", "Weaknesses", "Opportunities (your ideas)", "Threats / competitors"],
            },
            {
              section: "5. PM Opportunity Areas",
              items: ["Features to build", "Retention improvements", "Growth levers", "AI integration ideas"],
            },
            {
              section: "6. Blog Angle",
              items: ["Hook sentence", "3 key insights", "Your unique take", "Call to action"],
            },
          ].map((section) => (
            <div key={section.section} className="bg-slate-50 rounded-lg p-3">
              <p className="font-semibold text-slate-700 mb-2">{section.section}</p>
              <ul className="space-y-1 text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="text-brand-500">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Full template available in{" "}
            <code className="bg-slate-100 px-1 rounded">templates/company-analysis.md</code>
          </p>
        </div>
      </div>
    </div>
  );
}
