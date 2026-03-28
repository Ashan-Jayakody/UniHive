import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Role-Based Access',
    description:
      'Support structured access for students, faculty members, and administrators through a secure academic platform.',
    icon: '🎓',
  },
  {
    title: 'Real-Time Notifications',
    description:
      'Keep users informed with immediate updates for discussion replies, account activity, and institutional alerts.',
    icon: '🔔',
  },
  {
    title: 'Academic Communication',
    description:
      'Encourage meaningful collaboration through organised discussions, replies, and structured knowledge exchange.',
    icon: '💬',
  },
  {
    title: 'Administrative Oversight',
    description:
      'Provide institutional visibility through user administration, analytics, and exportable reporting tools.',
    icon: '📊',
  },
];

const modules = [
  {
    title: 'Profile Management',
    description:
      'Maintain academic identity, update account details, manage profile images, and review saved activity records.',
    icon: '👤',
  },
  {
    title: 'Discussion Workspace',
    description:
      'Create structured academic discussions, participate in topic-based conversations, and organise community responses.',
    icon: '📝',
  },
  {
    title: 'Notification Centre',
    description:
      'Track live platform alerts, review account updates, and manage important communication efficiently.',
    icon: '📨',
  },
  {
    title: 'Administrative Tools',
    description:
      'Monitor users, review analytics, manage operational records, and support institutional control.',
    icon: '🛠️',
  },
];

const quickLinks = [
  { label: 'Dashboard Ready', icon: '📁' },
  { label: 'Secure Authentication', icon: '🔐' },
  { label: 'Live Collaboration', icon: '⚡' },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <nav className="rounded-[2rem] border border-white/70 bg-white/80 px-5 py-4 shadow-xl shadow-slate-200/60 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            UniHive
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            Academic Collaboration Platform
          </h1>
        </nav>

        <section className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 shadow-2xl shadow-slate-200/70 backdrop-blur-sm">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                UniHive Platform
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                A modern academic platform for communication, collaboration, and institutional efficiency.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                UniHive provides a professional digital environment where students, faculty members,
                and administrators can communicate effectively, manage academic interactions, receive
                real-time updates, and support a stronger university experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Get Started
                </Link>

                <Link
                  to="/login"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Access Platform
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {quickLinks.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 p-8 text-white sm:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
                Platform Value
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15">
                  <h3 className="text-lg font-semibold">Centralised academic engagement</h3>
                  <p className="mt-2 text-sm leading-7 text-blue-50">
                    Bring communication, notifications, profiles, and discussion activity into one unified institutional platform.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15">
                  <h3 className="text-lg font-semibold">Practical university use</h3>
                  <p className="mt-2 text-sm leading-7 text-blue-50">
                    Support meaningful collaboration, academic visibility, and efficient management through features aligned with real campus needs.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15">
                  <h3 className="text-lg font-semibold">Professional user experience</h3>
                  <p className="mt-2 text-sm leading-7 text-blue-50">
                    Present a clean, modern, and structured interface suitable for institutional environments and project demonstration.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">
                  Designed For
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                    Students
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                    Faculty
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                    Administrators
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 text-2xl shadow-sm">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2.25rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-slate-200/70 backdrop-blur-sm sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Core Modules
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Powerful features that support the complete UniHive experience
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              UniHive is built around practical academic functions that strengthen communication,
              profile management, alert handling, and institutional oversight within one integrated system.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {modules.map((item) => (
              <div
                key={item.title}
                className="group rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;