// src/features/portfolio/components/behavioral/ActionPlan.tsx
import React from 'react';
import { ClipboardList, CheckSquare, Lightbulb } from 'lucide-react';

export interface ActionPlanData {
    advisorMindset: string;
    actions: string[];
}

interface ActionPlanProps {
    plan: ActionPlanData;
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ plan }) => {
    return (
        // 修改: 移除 h-full, 加上 w-full
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 w-full">
            <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Next Best Action</h3>
            </div>

            <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200/50">
                <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Advisor Mindset</span>
                        <p className="text-gray-800 font-medium mt-1 text-sm leading-snug">{plan.advisorMindset}</p>
                    </div>
                </div>
            </div>

            <ul className="space-y-2">
                {plan.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="mt-0.5 text-blue-500">
                            <CheckSquare className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed font-medium">{action}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};