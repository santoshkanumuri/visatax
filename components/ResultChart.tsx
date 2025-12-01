import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TaxResult } from '../types';

interface ResultChartProps {
  result: TaxResult;
}

export const ResultChart: React.FC<ResultChartProps> = ({ result }) => {
  const data = [
    { name: 'Take Home', value: result.takeHomePay, color: '#10b981', label: 'Net Pay' },
    { name: 'Federal', value: result.federalTaxLiability, color: '#3b82f6', label: 'Fed Tax' },
    { name: 'State', value: result.stateTax, color: '#64748b', label: 'State Tax' },
    { name: 'FICA', value: result.ficaTax, color: '#94a3b8', label: 'FICA' },
  ].filter(item => item.value > 0);

  return (
    <div className="h-64 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
          barSize={20}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={80} 
            tick={{fontSize: 12, fill: '#475569', fontWeight: 500}} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{fill: '#f1f5f9', radius: 4}}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
            labelStyle={{ display: 'none' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};