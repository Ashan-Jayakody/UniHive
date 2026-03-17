import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="app-shell overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
            UniHive Platform
          </p>

          <h1 className="mt-4 text-5xl font-bold leading-[1.1] text-slate-950 sm:text-6xl">
            Welcome to <span className="text-blue-600">UniHive</span>, a cleaner and more
            professional space for campus users.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-600">
            A collaborative academic platform where students, faculty members, and
            administrators can access role-based tools through a secure and organized
            user management experience.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Start with Registration
            </Link>

            <Link
              to="/login"
              className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Login to Dashboard
            </Link>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Smart peer connection',
                text: 'Bring students, mentors, and faculty into one smooth academic support system.',
              },
              {
                title: 'Trusted campus community',
                text: 'Maintain a safer and more organized environment for collaboration and user access.',
              },
              {
                title: 'Structured user flow',
                text: 'Provide clear onboarding and access paths for students, faculty, and admins.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-green-500" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">
                  Special Feature
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-950">
                  Academic Communication Hub
                </h2>
                <p className="mt-3 text-base leading-8 text-slate-600">
                  Support meaningful academic interaction through structured discussion
                  threads, topic-based communication spaces, nested replies, and
                  searchable conversations across the platform.
                </p>
              </div>

              <Link
                to="/communication"
                className="rounded-2xl bg-green-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Open Communication Hub
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                'Thread-based academic discussions',
                'Topic-specific communication spaces',
                'Nested replies for structured interaction',
                'Search and filter across discussions',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 ring-1 ring-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:justify-self-end">
          <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 ring-1 ring-slate-800/40 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300">Core Module</p>
                <h2 className="mt-2 text-4xl font-bold text-white">User Management Portal</h2>
              </div>

              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-green-300">
                Active
              </span>
            </div>

            <div className="mt-6 rounded-[2rem] border border-white/5 bg-white/5 p-6">
              <p className="text-sm font-medium text-slate-300">Module overview</p>
              <p className="mt-3 text-2xl font-semibold leading-10 text-white">
                Manage user accounts, review roles, and maintain organized access control
                across the platform.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-blue-400/20">
                  Role-based access
                </span>
                <span className="rounded-full bg-green-500/15 px-4 py-2 text-sm font-medium text-green-200 ring-1 ring-green-400/20">
                  Account management
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                  Secure user records
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-white p-5 text-slate-900">
                <p className="text-sm font-medium text-slate-500">Primary focus</p>
                <p className="mt-3 text-xl font-semibold leading-8">
                  Centralized user account administration for students, faculty, and admins.
                </p>
              </div>

              <div className="rounded-[1.75rem] bg-white/5 p-5 ring-1 ring-white/5">
                <p className="text-sm font-medium text-slate-300">Administrative value</p>
                <p className="mt-3 text-xl font-semibold leading-8 text-white">
                  Support efficient platform control through structured user records and
                  access visibility.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;