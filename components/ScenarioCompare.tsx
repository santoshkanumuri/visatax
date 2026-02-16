import React, { useMemo, useState } from 'react';
import { GitCompareArrows, Save, Trash2, FolderOpen } from 'lucide-react';
import { SavedScenario } from '../types';
import { calculateTax } from '../services/taxCalculator';
import { Tooltip } from './Tooltip';

interface ScenarioCompareProps {
  scenarios: SavedScenario[];
  selectedScenarioIds: string[];
  onSelectScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onLoadScenario: (scenarioId: string) => void;
  onSaveScenario: (name: string) => void;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export const ScenarioCompare: React.FC<ScenarioCompareProps> = ({
  scenarios,
  selectedScenarioIds,
  onSelectScenario,
  onDeleteScenario,
  onLoadScenario,
  onSaveScenario,
}) => {
  const [scenarioName, setScenarioName] = useState('');

  const selectedScenarios = useMemo(
    () => scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id)),
    [scenarios, selectedScenarioIds]
  );

  const comparison = useMemo(() => {
    if (selectedScenarios.length !== 2) return null;
    const first = selectedScenarios[0];
    const second = selectedScenarios[1];
    const firstResult = calculateTax(first.input);
    const secondResult = calculateTax(second.input);
    return { first, second, firstResult, secondResult };
  }, [selectedScenarios]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <GitCompareArrows size={16} className="text-indigo-600" />
          Save & Compare Scenarios
        </h3>
        <Tooltip text="Save variations like with/without 401(k) or Texas vs California and compare outcomes quickly." />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="Scenario name (e.g., TX job)"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        />
        <button
          onClick={() => {
            onSaveScenario(scenarioName);
            setScenarioName('');
          }}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
        >
          <Save size={14} />
          Save Current
        </button>
      </div>

      {scenarios.length === 0 ? (
        <p className="text-sm text-slate-500">No saved scenarios yet.</p>
      ) : (
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{scenario.name}</p>
                  <p className="text-xs text-slate-500">
                    Saved {new Date(scenario.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectScenario(scenario.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      selectedScenarioIds.includes(scenario.id)
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedScenarioIds.includes(scenario.id) ? 'Selected' : 'Compare'}
                  </button>
                  <button
                    onClick={() => onLoadScenario(scenario.id)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <FolderOpen size={12} />
                    Load
                  </button>
                  <button
                    onClick={() => onDeleteScenario(scenario.id)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comparison && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Compare Result</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white p-3 border border-indigo-100">
              <p className="font-semibold text-slate-900">{comparison.first.name}</p>
              <p className="text-slate-600 mt-1">Take-home: {formatCurrency(comparison.firstResult.takeHomePay)}</p>
              <p className="text-slate-600">Refund/Owe: {formatCurrency(comparison.firstResult.totalRefundOrOwe)}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-indigo-100">
              <p className="font-semibold text-slate-900">{comparison.second.name}</p>
              <p className="text-slate-600 mt-1">Take-home: {formatCurrency(comparison.secondResult.takeHomePay)}</p>
              <p className="text-slate-600">Refund/Owe: {formatCurrency(comparison.secondResult.totalRefundOrOwe)}</p>
            </div>
          </div>
          <p className="text-xs text-indigo-800 mt-3">
            Difference (Take-home): {formatCurrency(comparison.secondResult.takeHomePay - comparison.firstResult.takeHomePay)}
          </p>
        </div>
      )}
    </div>
  );
};
