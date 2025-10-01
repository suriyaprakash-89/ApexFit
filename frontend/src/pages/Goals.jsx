// frontend/src/pages/Goals.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Plus, Target, TrendingUp, Calendar } from 'lucide-react';

const Goals = () => {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    goal_type: 'steps',
    target_value: '',
    current_value: '0',
    deadline: ''
  });

  const goalTypes = [
    { value: 'steps', label: 'Daily Steps', unit: 'steps', icon: '👣' },
    { value: 'calories', label: 'Calories Burned', unit: 'cal', icon: '🔥' },
    { value: 'sleep', label: 'Sleep Hours', unit: 'hours', icon: '😴' },
    { value: 'water', label: 'Water Intake', unit: 'glasses', icon: '💧' },
    { value: 'weight', label: 'Weight Goal', unit: 'kg', icon: '⚖️' },
    { value: 'workout', label: 'Workout Days', unit: 'days', icon: '💪' }
  ];

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          goal_type: formData.goal_type,
          target_value: parseFloat(formData.target_value),
          current_value: parseFloat(formData.current_value),
          deadline: formData.deadline || null,
          achieved: parseFloat(formData.current_value) >= parseFloat(formData.target_value)
        }]);

      if (error) throw error;

      toast.success('Goal created successfully!');
      setShowForm(false);
      setFormData({
        goal_type: 'steps',
        target_value: '',
        current_value: '0',
        deadline: ''
      });
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (goalId, newValue) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const achieved = newValue >= goal.target_value;
      
      const { error } = await supabase
        .from('goals')
        .update({
          current_value: newValue,
          achieved,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
      
      toast.success('Progress updated!');
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      toast.success('Goal deleted successfully!');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const calculateProgress = (goal) => {
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fitness Goals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Create New Goal</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Type
                </label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                >
                  {goalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Progress
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const goalType = goalTypes.find(t => t.value === goal.goal_type);
          const progress = calculateProgress(goal);
          const isOverdue = goal.deadline && new Date(goal.deadline) < new Date();

          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{goalType?.icon}</span>
                  <h3 className="font-semibold text-gray-800 dark:text-white capitalize">
                    {goal.goal_type}
                  </h3>
                </div>
                {goal.achieved && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Achieved! 🎉
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {goal.current_value} / {goal.target_value} {goalType?.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goal.achieved ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {progress}% complete
                </p>
              </div>

              {goal.deadline && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className={isOverdue && !goal.achieved ? 'text-red-500' : ''}>
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    {isOverdue && !goal.achieved && ' (Overdue)'}
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={goal.target_value}
                  defaultValue={goal.current_value}
                  onBlur={(e) => updateProgress(goal.id, parseFloat(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Update progress"
                />
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No goals set yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;