// frontend/src/components/HealthIntegrations.jsx
import React, { useState } from "react";
import { Apple, Google, Watch, Smartphone, Zap } from "lucide-react";

const HealthIntegrations = () => {
  const [integrations, setIntegrations] = useState([
    { id: 1, name: "Apple Health", connected: false, icon: Apple },
    { id: 2, name: "Google Fit", connected: false, icon: Google },
    { id: 3, name: "Fitbit", connected: false, icon: Watch },
    { id: 4, name: "Samsung Health", connected: false, icon: Smartphone },
    { id: 5, name: "Strava", connected: false, icon: Zap },
  ]);

  const toggleIntegration = (id) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Zap className="w-6 h-6 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Health Integrations
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Connect your favorite health and fitness apps to sync data and get a
        complete picture of your wellness.
      </p>

      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-4">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="font-medium text-gray-800 dark:text-white">
                  {integration.name}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={integration.connected}
                  onChange={() => toggleIntegration(integration.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          🔒 Your data is always secure. We only request read access to sync
          your health metrics and never share your information with third
          parties without your permission.
        </p>
      </div>
    </div>
  );
};

export default HealthIntegrations;
