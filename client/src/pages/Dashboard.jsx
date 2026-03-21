
import { Link } from 'react-router-dom';
import { User, Folder, MessageSquare, LifeBuoy, GraduationCap } from 'lucide-react';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const modules = [
  {
    to: '/profile',
    title: 'User Management',
    desc: 'Manage your profile, roles, and account settings.',
    tags: ['Profile', 'Roles'],
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: <User size={15} strokeWidth={1.5}/>,
  },
  {
    to: '/resourceShare',
    title: 'Resource Sharing',
    desc: 'Browse and share notes, files, and study materials.',
    tags: ['Notes', 'Files'],
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: <Folder size={15} strokeWidth={1.5}/>,
  },
  {
    to: '/peerTutoring',
    title: 'Peer Tutoring',
    desc: 'Find or become a tutor. Schedule 1-on-1 sessions.',
    tags: ['Sessions', 'Schedule'],
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    icon: <GraduationCap size={18} strokeWidth={1.5} />,
  },
  {
    to: '/helpboard',
    title: 'Help Exchange',
    desc: 'Post or answer help requests from fellow students.',
    tags: ['Requests', 'Help Board'],
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: <LifeBuoy size={15} strokeWidth={1.5} />,
    highlight: true,
  },
];

const Dashboard = () => {
  const user = getUser();

  const stats = [
    {
      label: 'ACCOUNT ROLE',
      tag: 'Role',
      value: user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : '—',
      desc: 'Current access level',
      valueColor: 'text-indigo-600',
    },
    {
      label: 'ACCOUNT STATUS',
      tag: 'Status',
      value: user?.status
        ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
        : 'Active',
      desc: 'Operational status',
      valueColor: 'text-green-600',
    },
    {
      label: 'EMAIL VERIFICATION',
      tag: 'Security',
      value: user?.emailVerified ? 'Verified' : 'Pending',
      desc: 'Security confirmation',
      valueColor: user?.emailVerified ? 'text-green-600' : 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      

      <main className="mx-auto max-w-5xl px-6 py-7">

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Good morning
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening on your platform today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-7 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {s.label}
                </p>
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400">
                  {s.tag}
                </span>
              </div>
              <p className={`text-lg font-semibold ${s.valueColor}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Module cards */}
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Platform modules
        </p>
        <div className="grid grid-cols-2 gap-3">
          {modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className={`group flex flex-col gap-3 rounded-xl border bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm ${
                m.highlight ? 'border-indigo-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.iconBg} ${m.iconColor}`}>
                  {m.icon}
                </div>
                <span className="text-slate-300 transition group-hover:text-indigo-400">›</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{m.desc}</p>
              </div>
              <div className="flex gap-1.5">
                {m.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;