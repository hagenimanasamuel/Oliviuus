// SecurityGridPresentation.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Shield,
    AlertTriangle,
    Users,
    Search,
    Bell,
    Camera,
    MapPin,
    Phone,
    CreditCard,
    Wifi,
    Building,
    Laptop,
    Plus,
    Activity,
    Database,
    Network,
    Eye,
    CheckCircle,
    XCircle,
    Map,
    Filter,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Fullscreen,
    Minimize,
    Volume2,
    VolumeX,
    Zap,
    Target,
    Satellite,
    Cctv,
    Car,
    Hotel,
    Stethoscope,
    ShoppingCart,
    Plane,
    Bus,
    Train,
    Landmark as Bank,
    Smartphone,
    Mail,
    UserCheck,
    Clock,
    Navigation,
    Radio,
    Cloud,
    Server,
    Lock,
    Unlock,
    EyeOff,
    Download,
    Upload,
    RefreshCw,
    BarChart3,
    Settings,
    HelpCircle,
    X,
    Menu,
    ChevronRight,
    ChevronLeft,
    Star,
    Award,
    Trophy,
    Crown,
    Sparkles,
} from 'lucide-react';

// ==================== COMPONENT DEFINITIONS ====================

// StatCard Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, darkMode }) => {
    const colorClasses = {
        red: 'from-red-500 to-orange-500',
        green: 'from-green-500 to-emerald-500',
        orange: 'from-orange-500 to-amber-500',
        blue: 'from-blue-500 to-cyan-500'
    };

    return (
        <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${colorClasses[color]} text-white`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">{trend}</p>
            </div>
        </div>
    );
};

// Dashboard Component
const DashboardView = ({ stats, recentAlerts, recentLogs, darkMode }) => (
    <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Wanted Persons"
                value={stats.wantedCount}
                subtitle="Active cases"
                icon={Users}
                color="red"
                trend={`${stats.highRiskCount} high risk`}
                darkMode={darkMode}
            />
            <StatCard
                title="Integrated Services"
                value={stats.servicesCount}
                subtitle="Systems connected"
                icon={Network}
                color="green"
                trend="All operational"
                darkMode={darkMode}
            />
            <StatCard
                title="Active Alerts"
                value={stats.alertsCount}
                subtitle="Live detections"
                icon={Bell}
                color="orange"
                trend="Real-time tracking"
                darkMode={darkMode}
            />
            <StatCard
                title="Total Verifications"
                value={stats.totalChecks.toLocaleString()}
                subtitle="API calls today"
                icon={Database}
                color="blue"
                trend="24/7 monitoring"
                darkMode={darkMode}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Alerts */}
            <div className={`rounded-2xl shadow-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="p-6 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span>Recent Security Alerts</span>
                        </h2>
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            {recentAlerts.length} Active
                        </span>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {recentAlerts.length > 0 ? (
                        recentAlerts.map(alert => (
                            <div key={alert.id} className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                <div className="flex-shrink-0">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{alert.person.name}</p>
                                    <p className="text-sm text-gray-600">Detected at {alert.service} • {alert.location}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500">No active alerts</p>
                            <p className="text-sm text-gray-400">All systems are clear</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={`rounded-2xl shadow-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="p-6 border-b border-gray-600">
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        <span>Recent Activity</span>
                    </h2>
                </div>
                <div className="p-6 space-y-3">
                    {recentLogs.slice(0, 6).map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${log.status === 'ALERT' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {log.status === 'ALERT' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{log.service}</p>
                                    <p className="text-xs text-gray-500">{log.location}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${log.status === 'ALERT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {log.status}
                            </span>
                        </div>
                    ))}
                    {recentLogs.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            No activity yet. Run tests in the simulation panel.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// Services View
const ServicesView = ({ services, darkMode }) => (
    <div className="space-y-6">
        <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Integrated Services Network</h2>
                    <p className="text-gray-600 mt-1">All systems connected to Rwanda Security Grid API</p>
                </div>
                <div className="bg-green-50 text-green-800 px-4 py-2 rounded-full font-medium">
                    {services.length} Systems Active
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map(service => {
                const ServiceIcon = service.icon;
                return (
                    <div key={service.id} className={`rounded-2xl shadow-xl border p-6 hover:shadow-2xl transition-all duration-300 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <ServiceIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                {service.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{service.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 capitalize">{service.type} System</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">{service.usage || '0'}</span>
                            <span className="text-sm text-gray-500">usage</span>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

// Wanted View Component
const WantedView = ({ persons, onAddPerson, showAddModal, setShowAddModal, darkMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        nationalId: '',
        phoneNumber: '',
        crime: '',
        riskLevel: 'medium',
        bounty: '',
        lastSeen: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddPerson(formData);
        setFormData({
            name: '',
            nationalId: '',
            phoneNumber: '',
            crime: '',
            riskLevel: 'medium',
            bounty: '',
            lastSeen: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Wanted Persons Database</h2>
                        <p className="text-gray-600 mt-1">National security threat database</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Wanted Person</span>
                    </button>
                </div>
            </div>

            {/* Add Person Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className={`rounded-2xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } border`}>
                        <div className="p-6 border-b border-gray-600">
                            <h3 className="text-xl font-bold">Add Wanted Person</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="National ID"
                                value={formData.nationalId}
                                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Crime"
                                value={formData.crime}
                                onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Last Seen Location"
                                value={formData.lastSeen}
                                onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Bounty Amount"
                                value={formData.bounty}
                                onChange={(e) => setFormData({ ...formData, bounty: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <select
                                value={formData.riskLevel}
                                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="low">Low Risk</option>
                                <option value="medium">Medium Risk</option>
                                <option value="high">High Risk</option>
                            </select>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                                >
                                    Add to Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Wanted Persons Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {persons.map(person => (
                    <div key={person.id} className={`rounded-2xl shadow-xl border-l-4 ${darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } ${person.riskLevel === 'high' ? 'border-red-500' :
                            person.riskLevel === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                        }`}>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="text-4xl">{person.photo}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{person.name}</h3>
                                        <p className="text-sm text-gray-600">ID: {person.nationalId}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${person.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                        person.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {person.riskLevel.toUpperCase()} RISK
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Crime</p>
                                    <p className="text-sm text-gray-600">{person.crime}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Phone</p>
                                        <p className="text-sm text-gray-600">{person.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Last Seen</p>
                                        <p className="text-sm text-gray-600">{person.lastSeen}</p>
                                    </div>
                                </div>

                                {person.bounty && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Bounty</p>
                                        <p className="text-sm text-red-600 font-bold">{person.bounty}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Tracking View
const TrackingView = ({ logs, darkMode }) => (
    <div className="space-y-6">
        <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Live Tracking System</h2>
                    <p className="text-gray-600 mt-1">Real-time verification logs across all integrated services</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-green-50 text-green-800 px-4 py-2 rounded-full font-medium">
                        {logs.length} Total Logs
                    </div>
                </div>
            </div>
        </div>

        <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{log.service}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{log.userData.nationalId || log.userData.phoneNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">{log.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${log.status === 'ALERT'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {log.status === 'ALERT' ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                        {log.status}
                                        {log.matchedPerson && ` - ${log.matchedPerson.name}`}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {logs.length === 0 && (
                <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tracking logs yet</p>
                    <p className="text-sm text-gray-400">Run tests in the simulation panel to see activity</p>
                </div>
            )}
        </div>
    </div>
);

// Alerts View
const AlertsView = ({ alerts, onClearAlert, darkMode }) => (
    <div className="space-y-6">
        <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Security Alerts</h2>
                    <p className="text-gray-600 mt-1">Live detection notifications and response management</p>
                </div>
                <div className="bg-red-50 text-red-800 px-4 py-2 rounded-full font-medium">
                    {alerts.length} Active Alerts
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alerts.map(alert => (
                <div key={alert.id} className={`rounded-2xl shadow-xl border-l-4 ${darkMode ? 'bg-gray-800/50' : 'bg-white'
                    } ${alert.severity === 'high' ? 'border-red-500' :
                        alert.severity === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                    }`}>
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{alert.person.name}</h3>
                                    <p className="text-sm text-gray-600">National ID: {alert.person.nationalId}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                    alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {alert.severity.toUpperCase()} PRIORITY
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Detected At</p>
                                    <p className="text-sm text-gray-600">{alert.service}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Location</p>
                                    <p className="text-sm text-gray-600">{alert.location}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-900">Crime</p>
                                <p className="text-sm text-gray-600">{alert.person.crime}</p>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-medium transition-colors">
                                    Dispatch Unit
                                </button>
                                <button
                                    onClick={() => onClearAlert(alert.id)}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {alerts.length === 0 && (
            <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                <p className="text-gray-500">All systems are clear and monitoring continues 24/7</p>
            </div>
        )}
    </div>
);

// Simulation View
const SimulationView = ({ services, wantedPersons, onVerify, darkMode }) => {
    const [simulationData, setSimulationData] = useState({
        service: null,
        nationalId: '',
        phoneNumber: ''
    });
    const [result, setResult] = useState(null);

    const runSimulation = () => {
        if (!simulationData.service) {
            alert('Please select a service');
            return;
        }

        const userData = {
            nationalId: simulationData.nationalId || undefined,
            phoneNumber: simulationData.phoneNumber || undefined
        };

        const isClear = onVerify(simulationData.service, userData);
        setResult({
            clear: isClear,
            timestamp: new Date().toLocaleString(),
            service: simulationData.service.name,
            userData
        });
    };

    const useWantedPerson = (person) => {
        setSimulationData({
            ...simulationData,
            nationalId: person.nationalId,
            phoneNumber: person.phoneNumber
        });
        setResult(null);
    };

    const useRandomPerson = () => {
        const randomId = `1${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
        const randomPhone = `+25078${Math.floor(1000000 + Math.random() * 9000000)}`;

        setSimulationData({
            ...simulationData,
            nationalId: randomId,
            phoneNumber: randomPhone
        });
        setResult(null);
    };

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">System Testing</h2>
                        <p className="text-gray-600 mt-1">Test the security grid detection capabilities with real scenarios</p>
                    </div>
                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full font-medium">
                        Demo Mode
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulation Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <h3 className="text-lg font-bold mb-4">Test Security Verification</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
                                <select
                                    value={simulationData.service?.id || ''}
                                    onChange={(e) => setSimulationData({
                                        ...simulationData,
                                        service: services.find(s => s.id === parseInt(e.target.value))
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">Choose a service...</option>
                                    {services.map(service => {
                                        const ServiceIcon = service.icon;
                                        return (
                                            <option key={service.id} value={service.id}>
                                                {service.name} ({service.type})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">National ID</label>
                                    <input
                                        type="text"
                                        placeholder="Enter National ID"
                                        value={simulationData.nationalId}
                                        onChange={(e) => setSimulationData({ ...simulationData, nationalId: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Phone Number"
                                        value={simulationData.phoneNumber}
                                        onChange={(e) => setSimulationData({ ...simulationData, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={runSimulation}
                                disabled={!simulationData.service}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition-colors"
                            >
                                Run Security Verification
                            </button>

                            <button
                                onClick={useRandomPerson}
                                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Use Random Citizen Data
                            </button>
                        </div>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className={`rounded-2xl shadow-xl border p-6 ${result.clear
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center space-x-3 mb-4">
                                {result.clear ? (
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                )}
                                <div>
                                    <h3 className="text-lg font-bold">
                                        Verification Result: {result.clear ? 'CLEAR' : 'SECURITY ALERT'}
                                    </h3>
                                    <p className="text-sm text-gray-600">Service: {result.service} • {result.timestamp}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className={result.clear ? 'text-green-700' : 'text-red-700'}>
                                    {result.clear
                                        ? '✅ User verification successful. No match in wanted persons database.'
                                        : '🚨 WANTED PERSON DETECTED! Security forces have been alerted with location data.'}
                                </p>
                                {!result.clear && (
                                    <p className="text-sm text-red-600 font-medium">
                                        Immediate response unit dispatched to location.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Test Panel */}
                <div className="space-y-6">
                    <div className={`rounded-2xl shadow-xl border p-6 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <h3 className="text-lg font-bold mb-4">Quick Test</h3>
                        <p className="text-sm text-gray-600 mb-4">Test with wanted persons from database:</p>

                        <div className="space-y-3">
                            {wantedPersons.map(person => (
                                <button
                                    key={person.id}
                                    onClick={() => useWantedPerson(person)}
                                    className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">{person.photo}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{person.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{person.crime}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                        <h4 className="font-bold text-blue-900 mb-3">How It Works</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Real-time API verification</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Instant location tracking</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Automatic alert system</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>24/7 monitoring</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================

const SecurityGridPresentation = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [currentView, setCurrentView] = useState('presentation');
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [wantedPersons, setWantedPersons] = useState([]);
    const [services, setServices] = useState([]);
    const [trackingLogs, setTrackingLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [simulationResult, setSimulationResult] = useState(null);

    const presentationSteps = [
        {
            title: "Project X: Rwanda Security Grid",
            subtitle: "The Future of National Security",
            type: "title",
            background: "cyber"
        },
        {
            title: "The Problem: Modern Criminal Evasion",
            subtitle: "How criminals escape traditional tracking systems",
            type: "problem",
            cases: [
                {
                    icon: Car,
                    title: "Transportation Escape",
                    description: "Using buses, taxis, and virtual transport cards",
                    examples: ["RITCO buses", "Yego Kabiri", "Tap & Go cards", "Private taxis"]
                },
                {
                    icon: CreditCard,
                    title: "Financial Transactions",
                    description: "Moving through digital financial systems",
                    examples: ["MTN Mobile Money", "Airtel Money", "Bank transfers", "Agent networks"]
                },
                {
                    icon: Phone,
                    title: "Communication Channels",
                    description: "Using unregistered SIMs and encrypted apps",
                    examples: ["Airtel SIM cards", "MTN lines", "Burner phones", "Secure messaging"]
                },
                {
                    icon: Building,
                    title: "Public & Private Services",
                    description: "Blending into daily service usage",
                    examples: ["Hotels (Marriott, Radisson)", "Hospitals (KFH, CHUK)", "Shopping malls", "Government offices"]
                },
                {
                    icon: Cctv,
                    title: "Surveillance Avoidance",
                    description: "Evading public and private camera systems",
                    examples: ["Traffic cameras", "Business CCTV", "Facial recognition", "License plate tracking"]
                }
            ]
        },
        {
            title: "Online Crime Epidemic",
            subtitle: "Digital fraud and cybercrime patterns",
            type: "cybercrime",
            cases: [
                {
                    icon: Smartphone,
                    title: "SIM Card Fraud",
                    description: "Using unregistered SIMs for criminal activities",
                    process: ["Purchase unregistered SIM", "Execute fraud", "Dispose SIM", "Repeat"]
                },
                {
                    icon: Bank,
                    title: "Money Laundering",
                    description: "Moving stolen funds through multiple channels",
                    process: ["Mobile money fraud", "Bank transfers", "Cash withdrawals", "Asset purchases"]
                },
                {
                    icon: Laptop,
                    title: "Identity Theft",
                    description: "Stealing and using personal identities",
                    process: ["Data harvesting", "Identity creation", "Financial fraud", "Disappearance"]
                }
            ]
        },
        {
            title: "The Solution: Integrated Security Grid",
            subtitle: "A unified national tracking system",
            type: "solution",
            features: [
                {
                    icon: Network,
                    title: "Universal API Integration",
                    description: "Single security API across all Rwandan services"
                },
                {
                    icon: Satellite,
                    title: "Real-time Tracking",
                    description: "Instant location and activity monitoring"
                },
                {
                    icon: Zap,
                    title: "Automatic Alerts",
                    description: "Immediate notification of wanted person detection"
                },
                {
                    icon: Database,
                    title: "Centralized Intelligence",
                    description: "Unified database of all criminal activities"
                }
            ]
        },
        {
            title: "Live System Demonstration",
            subtitle: "See the Security Grid in action",
            type: "demo",
            action: "show_demo"
        },
        {
            title: "National Impact & Benefits",
            subtitle: "Transforming Rwanda's security landscape",
            type: "impact",
            benefits: [
                "99% reduction in criminal escape rates",
                "Real-time nationwide monitoring",
                "Automated law enforcement alerts",
                "Integrated public-private security",
                "Enhanced citizen safety and trust"
            ]
        },
        {
            title: "Implementation Roadmap",
            subtitle: "Phased national rollout strategy",
            type: "roadmap",
            phases: [
                { phase: 1, title: "Core Infrastructure", timeline: "3 months", focus: "Government systems" },
                { phase: 2, title: "Financial Integration", timeline: "2 months", focus: "Banks & Mobile Money" },
                { phase: 3, title: "Telecom Integration", timeline: "2 months", focus: "Airtel, MTN" },
                { phase: 4, title: "Public Services", timeline: "3 months", focus: "Transport, Healthcare" },
                { phase: 5, title: "Private Sector", timeline: "4 months", focus: "Businesses, Hotels" }
            ]
        },
        {
            title: "The Future is Secure",
            subtitle: "Join us in building a safer Rwanda",
            type: "conclusion",
            callToAction: "Ready to deploy Project X"
        }
    ];

    // Rwandan Services Database
    const rwandanServices = [
        // Telecom
        { id: 1, name: "MTN Rwanda", type: "telecom", category: "communication", icon: Phone, usage: "12.4M users", status: "active" },
        { id: 2, name: "Airtel Rwanda", type: "telecom", category: "communication", icon: Phone, usage: "4.8M users", status: "active" },

        // Mobile Money
        { id: 3, name: "MTN Mobile Money", type: "financial", category: "mobile_money", icon: CreditCard, usage: "8.2M users", status: "active" },
        { id: 4, name: "Airtel Money", type: "financial", category: "mobile_money", icon: CreditCard, usage: "3.1M users", status: "active" },

        // Banks
        { id: 5, name: "Bank of Kigali", type: "financial", category: "banking", icon: Bank, usage: "2.1M accounts", status: "active" },
        { id: 6, name: "Equity Bank Rwanda", type: "financial", category: "banking", icon: Bank, usage: "1.8M accounts", status: "active" },
        { id: 7, name: "GT Bank Rwanda", type: "financial", category: "banking", icon: Bank, usage: "900K accounts", status: "active" },

        // Transportation
        { id: 8, name: "RITCO", type: "transport", category: "bus", icon: Bus, usage: "50K daily", status: "active" },
        { id: 9, name: "Yego Kabiri", type: "transport", category: "taxi", icon: Car, usage: "15K daily", status: "active" },
        { id: 10, name: "Tap & Go", type: "transport", category: "payment", icon: CreditCard, usage: "200K users", status: "active" },
        { id: 11, name: "Volcano Express", type: "transport", category: "bus", icon: Bus, usage: "10K daily", status: "active" },

        // Hotels
        { id: 12, name: "Kigali Marriott", type: "hospitality", category: "hotel", icon: Hotel, usage: "500 guests/day", status: "active" },
        { id: 13, name: "Radisson Blu", type: "hospitality", category: "hotel", icon: Hotel, usage: "400 guests/day", status: "active" },
        { id: 14, name: "Serena Hotel", type: "hospitality", category: "hotel", icon: Hotel, usage: "300 guests/day", status: "active" },

        // Healthcare
        { id: 15, name: "King Faisal Hospital", type: "healthcare", category: "hospital", icon: Stethoscope, usage: "1K patients/day", status: "active" },
        { id: 16, name: "CHUK", type: "healthcare", category: "hospital", icon: Stethoscope, usage: "2K patients/day", status: "active" },
        { id: 17, name: "Kabinja Hospital", type: "healthcare", category: "hospital", icon: Stethoscope, usage: "800 patients/day", status: "active" },

        // Government
        { id: 18, name: "IREMBO", type: "government", category: "portal", icon: Laptop, usage: "100K daily", status: "active" },
        { id: 19, name: "RRA Portal", type: "government", category: "portal", icon: Laptop, usage: "50K daily", status: "active" },
        { id: 20, name: "NIDA", type: "government", category: "identity", icon: UserCheck, usage: "National ID", status: "active" },

        // Retail & Public
        { id: 21, name: "Simba Supermarket", type: "retail", category: "shopping", icon: ShoppingCart, usage: "5K daily", status: "active" },
        { id: 22, name: "Kigali Heights", type: "retail", category: "mall", icon: Building, usage: "8K daily", status: "active" },
        { id: 23, name: "Nyabugogo Taxi Park", type: "transport", category: "terminal", icon: MapPin, usage: "30K daily", status: "active" },

        // Surveillance
        { id: 24, name: "Traffic Cameras", type: "surveillance", category: "cctv", icon: Cctv, usage: "500 cameras", status: "active" },
        { id: 25, name: "City CCTV Network", type: "surveillance", category: "cctv", icon: Cctv, usage: "2K cameras", status: "active" }
    ];

    // Sample wanted persons with Rwandan context
    const sampleWanted = [
        {
            id: 1,
            name: "Jean Claude Ndayisaba",
            nationalId: "119988777666555",
            phoneNumber: "+250788123456",
            crime: "Armed Robbery & Financial Fraud - Kigali Central Bank Heist",
            riskLevel: "high",
            photo: "👨🏾‍💼",
            dateAdded: "2024-01-15",
            lastSeen: "Kigali, Gasabo District",
            bounty: "5,000,000 RWF",
            modusOperandi: "Uses multiple SIM cards, moves through public transport, stays in budget hotels"
        },
        {
            id: 2,
            name: "Marie Uwase",
            nationalId: "229977668899001",
            phoneNumber: "+250789987654",
            crime: "Large Scale Mobile Money Fraud - MTN & Airtel Scam Network",
            riskLevel: "high",
            photo: "👩🏾‍💼",
            dateAdded: "2024-01-10",
            lastSeen: "Kigali, Nyarugenge",
            bounty: "2,500,000 RWF",
            modusOperandi: "Creates fake agent accounts, uses unregistered SIMs, moves money through multiple channels"
        },
        {
            id: 3,
            name: "Patrick Habimana",
            nationalId: "336655447788992",
            phoneNumber: "+250783456789",
            crime: "Cyber Crime & Identity Theft - IREMBO Portal Breach",
            riskLevel: "high",
            photo: "👨🏾‍💻",
            dateAdded: "2024-01-08",
            lastSeen: "Huye District",
            bounty: "3,000,000 RWF",
            modusOperandi: "Uses public WiFi, fake identities, multiple bank accounts"
        }
    ];

    const presentationRef = useRef(null);

    useEffect(() => {
        // Initialize data
        const storedWanted = JSON.parse(localStorage.getItem('rwanda_wanted_persons')) || sampleWanted;
        const storedServices = JSON.parse(localStorage.getItem('rwanda_services')) || rwandanServices;
        const storedLogs = JSON.parse(localStorage.getItem('rwanda_tracking_logs')) || [];
        const storedAlerts = JSON.parse(localStorage.getItem('rwanda_alerts')) || [];

        setWantedPersons(storedWanted);
        setServices(storedServices);
        setTrackingLogs(storedLogs);
        setAlerts(storedAlerts);
    }, []);

    useEffect(() => {
        let interval;
        if (isPlaying && currentStep < presentationSteps.length - 1) {
            interval = setInterval(() => {
                setCurrentStep(prev => prev + 1);
            }, 8000); // 8 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep]);

    const enterFullscreen = () => {
        if (presentationRef.current) {
            if (presentationRef.current.requestFullscreen) {
                presentationRef.current.requestFullscreen();
            }
            setIsFullscreen(true);
        }
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const verifyUser = (service, userData) => {
        const matchedPerson = wantedPersons.find(person =>
            person.nationalId === userData.nationalId ||
            person.phoneNumber === userData.phoneNumber
        );

        const locations = [
            "Kigali City Center", "Nyabugogo Taxi Park", "Kimironko Market", "Remera Sector",
            "Gikondo", "Kacyiru", "Nyarugenge District", "Gasabo", "Kicukiro", "Gisozi"
        ];

        const log = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            service: service.name,
            userData,
            location: locations[Math.floor(Math.random() * locations.length)],
            deviceId: `DEV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            ipAddress: `196.192.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            status: matchedPerson ? 'ALERT' : 'CLEAR',
            matchedPerson: matchedPerson || null
        };

        const newLogs = [log, ...trackingLogs.slice(0, 199)];
        setTrackingLogs(newLogs);
        localStorage.setItem('rwanda_tracking_logs', JSON.stringify(newLogs));

        if (matchedPerson) {
            const alert = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                person: matchedPerson,
                service: service.name,
                location: log.location,
                deviceId: log.deviceId,
                ipAddress: log.ipAddress,
                severity: matchedPerson.riskLevel,
                status: 'ACTIVE'
            };
            const newAlerts = [alert, ...alerts.slice(0, 49)];
            setAlerts(newAlerts);
            localStorage.setItem('rwanda_alerts', JSON.stringify(newAlerts));
        }

        return !matchedPerson;
    };

    const addWantedPerson = (personData) => {
        const newPerson = {
            ...personData,
            id: Date.now(),
            dateAdded: new Date().toISOString().split('T')[0],
            photo: "👤"
        };
        const newWanted = [newPerson, ...wantedPersons];
        setWantedPersons(newWanted);
        localStorage.setItem('rwanda_wanted_persons', JSON.stringify(newWanted));
        setShowAddModal(false);
    };

    const addService = (serviceData) => {
        const newService = {
            ...serviceData,
            id: Date.now(),
            status: 'active',
            usage: "0 users"
        };
        const newServices = [newService, ...services];
        setServices(newServices);
        localStorage.setItem('rwanda_services', JSON.stringify(newServices));
        setShowServiceModal(false);
    };

    const runSimulation = (service, userData) => {
        const result = verifyUser(service, userData);
        setSimulationResult({
            clear: result,
            timestamp: new Date().toLocaleString(),
            service: service.name,
            userData,
            location: `Kigali, Sector ${Math.floor(Math.random() * 3) + 1}`
        });
        return result;
    };

    const currentStepData = presentationSteps[currentStep];

    if (currentView === 'presentation') {
        return (
            <div
                ref={presentationRef}
                className={`min-h-screen transition-all duration-500 ${darkMode
                        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
                        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900'
                    }`}
            >
                {/* Presentation Controls */}
                <div className="fixed top-6 right-6 z-50 flex space-x-3">
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`p-3 rounded-2xl backdrop-blur-lg border ${darkMode
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                : 'bg-white/50 border-gray-200 hover:bg-white/70'
                            } transition-all duration-300`}
                    >
                        {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </button>

                    <button
                        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                        className={`p-3 rounded-2xl backdrop-blur-lg border ${darkMode
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                : 'bg-white/50 border-gray-200 hover:bg-white/70'
                            } transition-all duration-300`}
                    >
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Fullscreen className="h-5 w-5" />}
                    </button>

                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-3 rounded-2xl backdrop-blur-lg border ${darkMode
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                : 'bg-white/50 border-gray-200 hover:bg-white/70'
                            } transition-all duration-300`}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    <button
                        onClick={() => setCurrentView('system')}
                        className={`p-3 rounded-2xl backdrop-blur-lg border ${darkMode
                                ? 'bg-green-600/50 border-green-500 hover:bg-green-500/50'
                                : 'bg-green-500/50 border-green-400 hover:bg-green-400/50'
                            } transition-all duration-300 font-medium`}
                    >
                        Enter System
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="fixed top-0 left-0 right-0 h-1 bg-gray-700/50 z-40">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${((currentStep + 1) / presentationSteps.length) * 100}%` }}
                    />
                </div>

                {/* Navigation Controls */}
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-4">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className={`p-3 rounded-2xl backdrop-blur-lg border transition-all duration-300 ${currentStep === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : darkMode
                                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                    : 'bg-white/50 border-gray-200 hover:bg-white/70'
                            }`}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-4 rounded-2xl backdrop-blur-lg border transition-all duration-300 ${darkMode
                                ? 'bg-blue-600/50 border-blue-500 hover:bg-blue-500/50'
                                : 'bg-blue-500/50 border-blue-400 hover:bg-blue-400/50'
                            }`}
                    >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>

                    <button
                        onClick={() => setCurrentStep(Math.min(presentationSteps.length - 1, currentStep + 1))}
                        disabled={currentStep === presentationSteps.length - 1}
                        className={`p-3 rounded-2xl backdrop-blur-lg border transition-all duration-300 ${currentStep === presentationSteps.length - 1
                                ? 'opacity-50 cursor-not-allowed'
                                : darkMode
                                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                    : 'bg-white/50 border-gray-200 hover:bg-white/70'
                            }`}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* Step Counter */}
                <div className="fixed bottom-6 right-6 z-50">
                    <div className={`px-4 py-2 rounded-2xl backdrop-blur-lg border ${darkMode
                            ? 'bg-gray-800/50 border-gray-700'
                            : 'bg-white/50 border-gray-200'
                        }`}>
                        <span className="font-mono text-sm">
                            {currentStep + 1} / {presentationSteps.length}
                        </span>
                    </div>
                </div>

                {/* Presentation Content */}
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="max-w-6xl w-full text-center">

                        {/* Title Slide */}
                        {currentStepData.type === 'title' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="relative">
                                    <Sparkles className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                                    <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                        Project X
                                    </h1>
                                    <div className="mt-2 text-2xl font-light text-gray-400">
                                        Rwanda Security Grid System
                                    </div>
                                </div>

                                <div className="mt-12 text-xl text-gray-300 max-w-2xl mx-auto">
                                    A revolutionary integrated security platform that transforms how Rwanda tracks and apprehends criminals across all digital and physical touchpoints.
                                </div>

                                <div className="mt-16 flex justify-center space-x-6">
                                    <div className="flex items-center space-x-2 text-green-400">
                                        <Shield className="h-5 w-5" />
                                        <span>National Security</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-blue-400">
                                        <Network className="h-5 w-5" />
                                        <span>Integrated Systems</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-purple-400">
                                        <Zap className="h-5 w-5" />
                                        <span>Real-time Tracking</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Problem Slide - Criminal Escape */}
                        {currentStepData.type === 'problem' && (
                            <div className="space-y-12 animate-slide-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                                    {currentStepData.cases.map((caseItem, index) => {
                                        const CaseIcon = caseItem.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-500 hover:scale-105 ${darkMode
                                                        ? 'bg-gray-800/50 border-gray-700 hover:border-red-400'
                                                        : 'bg-white/50 border-gray-200 hover:border-red-300'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="p-3 bg-red-500/20 rounded-xl">
                                                        <CaseIcon className="h-6 w-6 text-red-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">{caseItem.title}</h3>
                                                </div>
                                                <p className="text-gray-300 mb-4 text-sm">{caseItem.description}</p>
                                                <div className="space-y-2">
                                                    {caseItem.examples.map((example, idx) => (
                                                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-400">
                                                            <XCircle className="h-4 w-4 text-red-400" />
                                                            <span>{example}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Cybercrime Slide */}
                        {currentStepData.type === 'cybercrime' && (
                            <div className="space-y-12 animate-slide-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                                    {currentStepData.cases.map((crime, index) => {
                                        const CrimeIcon = crime.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`p-6 rounded-2xl backdrop-blur-lg border ${darkMode
                                                        ? 'bg-gray-800/50 border-gray-700'
                                                        : 'bg-white/50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="p-3 bg-orange-500/20 rounded-xl">
                                                        <CrimeIcon className="h-6 w-6 text-orange-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">{crime.title}</h3>
                                                </div>
                                                <p className="text-gray-300 mb-4 text-sm">{crime.description}</p>
                                                <div className="space-y-3">
                                                    {crime.process.map((step, idx) => (
                                                        <div key={idx} className="flex items-center space-x-3">
                                                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-sm text-gray-400">{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Solution Slide */}
                        {currentStepData.type === 'solution' && (
                            <div className="space-y-12 animate-slide-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                                    {currentStepData.features.map((feature, index) => {
                                        const FeatureIcon = feature.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`p-8 rounded-2xl backdrop-blur-lg border transition-all duration-500 hover:scale-105 ${darkMode
                                                        ? 'bg-gray-800/50 border-green-500/50 hover:border-green-400'
                                                        : 'bg-white/50 border-green-400/50 hover:border-green-300'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <div className="p-3 bg-green-500/20 rounded-xl">
                                                        <FeatureIcon className="h-8 w-8 text-green-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                                                </div>
                                                <p className="text-gray-300 text-lg">{feature.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Network Visualization */}
                                <div className="mt-16 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-96 h-96 border-2 border-green-400/30 rounded-full animate-pulse"></div>
                                        <div className="w-64 h-64 border-2 border-blue-400/30 rounded-full animate-pulse delay-1000"></div>
                                        <div className="w-32 h-32 border-2 border-purple-400/30 rounded-full animate-pulse delay-2000"></div>
                                    </div>

                                    <div className="relative z-10 grid grid-cols-3 gap-8">
                                        {['MTN Rwanda', 'Bank of Kigali', 'RITCO Buses', 'Kigali Marriott', 'IREMBO', 'Traffic Cameras'].map((service, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className={`p-4 rounded-2xl backdrop-blur-lg border mx-auto w-32 ${darkMode
                                                        ? 'bg-gray-800/50 border-gray-600'
                                                        : 'bg-white/50 border-gray-300'
                                                    }`}>
                                                    <div className="text-lg font-bold text-green-400">{service.split(' ')[0]}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Demo Slide */}
                        {currentStepData.type === 'demo' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="max-w-4xl mx-auto">
                                    <div className={`p-8 rounded-2xl backdrop-blur-lg border ${darkMode
                                            ? 'bg-gray-800/50 border-blue-500/50'
                                            : 'bg-white/50 border-blue-400/50'
                                        }`}>
                                        <div className="text-center space-y-6">
                                            <Zap className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
                                            <h3 className="text-3xl font-bold text-white">Live System Demonstration</h3>
                                            <p className="text-xl text-gray-300">
                                                See how the Security Grid detects and tracks wanted criminals across Rwanda's digital infrastructure
                                            </p>

                                            <button
                                                onClick={() => setCurrentView('system')}
                                                className="mt-8 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                                            >
                                                Launch Live Demo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                                    {wantedPersons.slice(0, 3).map((person, index) => (
                                        <div key={index} className={`p-4 rounded-2xl backdrop-blur-lg border ${darkMode
                                                ? 'bg-gray-800/50 border-red-500/50'
                                                : 'bg-white/50 border-red-400/50'
                                            }`}>
                                            <div className="flex items-center space-x-3">
                                                <div className="text-2xl">{person.photo}</div>
                                                <div>
                                                    <div className="font-bold text-white">{person.name}</div>
                                                    <div className="text-sm text-gray-400">{person.crime.split(' - ')[0]}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Impact Slide */}
                        {currentStepData.type === 'impact' && (
                            <div className="space-y-12 animate-slide-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="max-w-4xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {currentStepData.benefits.map((benefit, index) => (
                                            <div
                                                key={index}
                                                className={`p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${darkMode
                                                        ? 'bg-gray-800/50 border-green-500/50'
                                                        : 'bg-white/50 border-green-400/50'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                                                    <span className="text-lg text-white">{benefit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-16 grid grid-cols-4 gap-8 text-center">
                                    {[
                                        { value: '99%', label: 'Reduction in Escape Rate' },
                                        { value: '24/7', label: 'National Monitoring' },
                                        { value: '<30s', label: 'Alert Response Time' },
                                        { value: '100%', label: 'Service Coverage' }
                                    ].map((stat, index) => (
                                        <div key={index}>
                                            <div className="text-3xl font-bold text-green-400">{stat.value}</div>
                                            <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Roadmap Slide */}
                        {currentStepData.type === 'roadmap' && (
                            <div className="space-y-12 animate-slide-in">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="max-w-6xl mx-auto">
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-500 to-blue-500"></div>

                                        {currentStepData.phases.map((phase, index) => (
                                            <div
                                                key={index}
                                                className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                                                    }`}
                                            >
                                                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                                                    <div className={`p-6 rounded-2xl backdrop-blur-lg border ${darkMode
                                                            ? 'bg-gray-800/50 border-blue-500/50'
                                                            : 'bg-white/50 border-blue-400/50'
                                                        }`}>
                                                        <h3 className="text-xl font-bold text-white">Phase {phase.phase}: {phase.title}</h3>
                                                        <p className="text-green-400 font-semibold mt-2">{phase.timeline}</p>
                                                        <p className="text-gray-300 mt-2">{phase.focus}</p>
                                                    </div>
                                                </div>

                                                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>

                                                <div className="w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conclusion Slide */}
                        {currentStepData.type === 'conclusion' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="space-y-6">
                                    <Trophy className="h-20 w-20 text-yellow-400 mx-auto animate-pulse" />
                                    <h2 className="text-6xl font-bold text-white">{currentStepData.title}</h2>
                                    <p className="text-2xl text-gray-300">{currentStepData.subtitle}</p>
                                </div>

                                <div className="max-w-2xl mx-auto">
                                    <div className={`p-8 rounded-2xl backdrop-blur-lg border ${darkMode
                                            ? 'bg-gray-800/50 border-yellow-500/50'
                                            : 'bg-white/50 border-yellow-400/50'
                                        }`}>
                                        <h3 className="text-3xl font-bold text-center text-white mb-6">
                                            {currentStepData.callToAction}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            {[
                                                { icon: Shield, label: 'National Security', value: 'Enhanced' },
                                                { icon: Users, label: 'Citizen Safety', value: 'Guaranteed' },
                                                { icon: Target, label: 'Criminal Capture', value: '99% Success' },
                                                { icon: Zap, label: 'Response Time', value: '< 30 seconds' }
                                            ].map((item, index) => {
                                                const ItemIcon = item.icon;
                                                return (
                                                    <div key={index} className="text-center">
                                                        <ItemIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                                        <div className="text-white font-semibold">{item.label}</div>
                                                        <div className="text-green-400 text-sm">{item.value}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentView('system')}
                                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                                        >
                                            Deploy Project X
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // System View (Live Demo)
    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900'
            }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-2xl">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-2xl">
                                <Shield className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Rwanda Security Grid System</h1>
                                <p className="text-green-100 text-sm">Live Demonstration Mode</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setCurrentView('presentation')}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                            >
                                Back to Presentation
                            </button>
                            <div className="flex items-center space-x-2 bg-black/20 px-4 py-2 rounded-full">
                                <Activity className="h-5 w-5 animate-pulse" />
                                <span className="text-sm font-medium">LIVE DEMO</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="mt-6 flex space-x-1 overflow-x-auto">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: Activity },
                            { id: 'services', label: 'Services', icon: Network },
                            { id: 'wanted', label: 'Wanted Persons', icon: Users },
                            { id: 'tracking', label: 'Live Tracking', icon: Eye },
                            { id: 'alerts', label: 'Alerts', icon: Bell },
                            { id: 'simulate', label: 'Test System', icon: Search }
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${currentView === item.id
                                            ? 'bg-white text-green-800 shadow-lg'
                                            : 'text-green-100 hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                {currentView === 'dashboard' && (
                    <DashboardView
                        stats={{
                            wantedCount: wantedPersons.length,
                            servicesCount: services.length,
                            alertsCount: alerts.filter(a => a.status === 'ACTIVE').length,
                            totalChecks: trackingLogs.length,
                            highRiskCount: wantedPersons.filter(p => p.riskLevel === 'high').length
                        }}
                        recentAlerts={alerts.filter(a => a.status === 'ACTIVE').slice(0, 5)}
                        recentLogs={trackingLogs.slice(0, 5)}
                        darkMode={darkMode}
                    />
                )}

                {currentView === 'services' && (
                    <ServicesView services={services} darkMode={darkMode} />
                )}

                {currentView === 'wanted' && (
                    <WantedView
                        persons={wantedPersons}
                        onAddPerson={addWantedPerson}
                        showAddModal={showAddModal}
                        setShowAddModal={setShowAddModal}
                        darkMode={darkMode}
                    />
                )}

                {currentView === 'tracking' && (
                    <TrackingView logs={trackingLogs} darkMode={darkMode} />
                )}

                {currentView === 'alerts' && (
                    <AlertsView alerts={alerts.filter(a => a.status === 'ACTIVE')} onClearAlert={(id) => setAlerts(alerts.filter(a => a.id !== id))} darkMode={darkMode} />
                )}

                {currentView === 'simulate' && (
                    <SimulationView
                        services={services}
                        wantedPersons={wantedPersons}
                        onVerify={runSimulation}
                        darkMode={darkMode}
                    />
                )}
            </main>
        </div>
    );
};

export default SecurityGridPresentation;