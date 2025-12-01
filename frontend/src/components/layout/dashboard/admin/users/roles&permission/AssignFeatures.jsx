import React, { useState, useEffect } from "react";
import axios from "../../../../../../api/axios";

export default function AssignFeatures({ role, onClose }) {
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState(new Set(role.features || []));

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data } = await axios.get("/features");
      setFeatures(data);
    } catch (error) {
      console.error("Error fetching features", error);
    }
  };

  const toggleFeature = (feature) => {
    const updated = new Set(selected);
    if (updated.has(feature)) {
      updated.delete(feature);
    } else {
      updated.add(feature);
    }
    setSelected(updated);
  };

  const handleSave = async () => {
    try {
      await axios.post(`/roles/${role.id}/features`, { features: [...selected] });
      onClose();
    } catch (error) {
      console.error("Error saving features", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Assign Features to {role.name}</h2>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {features.map((feature) => (
            <label key={feature.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selected.has(feature.key)}
                onChange={() => toggleFeature(feature.key)}
              />
              <span>{feature.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
