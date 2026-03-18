import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const user = getUser();

  const stats = [
    {
      title: 'Account Role',
      value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '-',
      subtitle: 'Your current access level within the platform.',
      badge: 'Role',
      cardClass: 'bg-blue-50 ring-1 ring-blue-100',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Account Status',
      value: user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active',
      subtitle: 'Current operational status of your account.',
      badge: 'Status',
      cardClass: 'bg-green-50 ring-1 ring-green-100',
      valueClass: 'text-green-700',
    },
    {
      title: 'Email Verification',
      value: user?.emailVerified ? 'Verified' : 'Pending',
      subtitle: 'Security confirmation status for your email address.',
      badge: 'Security',
      cardClass: 'bg-slate-100 ring-1 ring-slate-200',
      valueClass: 'text-slate-900',
    },
  ];

  return (
    <div className="app-shell min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <AppHeader
          title="Dashboard"
          subtitle="Welcome to your UniHive workspace. Review your current platform status from one professional control panel."
        />

        <div className="relative z-10 grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;