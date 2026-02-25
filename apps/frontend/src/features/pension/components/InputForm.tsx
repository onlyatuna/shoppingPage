import React, { useState } from 'react';
import { UserInputs, Occupation } from '../types';
import { OCCUPATION_LABELS } from '../utils/constants';
import {
    ChevronDown, ChevronUp, ShieldAlert, TrendingUp,
    Briefcase, PiggyBank, Info
} from 'lucide-react';

interface InputFormProps {
    inputs: UserInputs;
    onChange: (name: keyof UserInputs, value: any) => void;
}

interface SectionHeaderProps {
    title: string;
    isOpen: boolean;
    toggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, isOpen, toggle }) => (
    <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
    >
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
);

interface InputGroupProps {
    label: string;
    name: keyof UserInputs;
    value: number;
    onChange: (name: keyof UserInputs, value: any) => void;
    tooltip?: string;
    step?: number;
    min?: number;
    max?: number;
}

const InputGroup: React.FC<InputGroupProps> = ({
    label,
    name,
    value,
    onChange,
    tooltip,
    step = 1,
    min,
    max
}) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
            {label}
            {tooltip && (
                <div className="group relative">
                    <Info size={12} className="text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {tooltip}
                    </div>
                </div>
            )}
        </label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
            step={step}
            min={min}
            max={max}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
        />
    </div>
);

export const InputForm: React.FC<InputFormProps> = ({ inputs, onChange }) => {
    const [openSections, setOpenSections] = useState({
        basic: true,
        occupation: true,
        personal: true
    });

    const toggle = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // 職業判斷
    const isLabor = inputs.occupation === 'labor';
    const isCivil = inputs.occupation === 'civil';
    const isTeacher = inputs.occupation === 'teacher';
    const isMilitary = inputs.occupation === 'military';
    const isNational = inputs.occupation === 'national';

    // 動態薪資欄位標籤
    const getSalaryLabel = () => {
        if (isLabor) return '目前月薪 (全薪)';
        if (isCivil || isTeacher || isMilitary) return '本俸 (銓敘審定)';
        if (isNational) return '計算基準薪資 (可忽略)';
        return '計算基準薪資';
    };

    // 支柱一標籤
    const getPillar1Label = () => {
        if (isLabor) return '勞保投保薪資';
        if (isCivil || isTeacher) return '公保保俸';
        if (isMilitary) return '軍保保俸';
        if (isNational) return '國保基準 (固定)';
        return '投保薪資/保俸';
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200">

            {/* 1. 基本設定與風險檢核 */}
            <SectionHeader title="1. 基本設定 & 風險保障" isOpen={openSections.basic} toggle={() => toggle('basic')} />
            {openSections.basic && (
                <div className="p-4 bg-gray-50 space-y-4">
                    {/* 年齡輸入 */}
                    <div className="grid grid-cols-3 gap-4">
                        <InputGroup
                            label="目前年齡"
                            name="currentAge"
                            value={inputs.currentAge}
                            onChange={onChange}
                            min={18}
                            max={100}
                        />
                        <InputGroup
                            label="退休年齡"
                            name="retirementAge"
                            value={inputs.retirementAge}
                            onChange={onChange}
                            min={50}
                            max={100}
                        />
                        <InputGroup
                            label="預期壽命"
                            name="lifeExpectancy"
                            value={inputs.lifeExpectancy}
                            onChange={onChange}
                            min={60}
                            max={120}
                        />
                    </div>

                    {/* 生活費與通膨 */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup
                            label="目標月生活費 (現值)"
                            name="targetMonthlyExpense"
                            value={inputs.targetMonthlyExpense}
                            onChange={onChange}
                            step={1000}
                            tooltip="以今天的購買力計算，退休後每月需要多少生活費"
                        />
                        <InputGroup
                            label="通膨率 (%)"
                            name="inflationRate"
                            value={inputs.inflationRate}
                            onChange={onChange}
                            step={0.1}
                            min={0}
                            max={10}
                        />
                    </div>

                    {/* 風險保障檢核 */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                                是否有足額商業醫療/長照保險？
                            </span>
                            <input
                                type="checkbox"
                                checked={inputs.hasCommercialInsurance}
                                onChange={(e) => onChange('hasCommercialInsurance', e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                        </label>
                        {!inputs.hasCommercialInsurance && (
                            <p className="text-xs text-orange-600 mt-2 ml-6">
                                *系統將自動於平均餘命最後8年加入長照預備金 (4萬/月)
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* 2. 支柱一二 (動態欄位) */}
            <SectionHeader title="2. 職業與社會保險" isOpen={openSections.occupation} toggle={() => toggle('occupation')} />
            {openSections.occupation && (
                <div className="p-4 bg-gray-50 space-y-4">
                    {/* 職業選擇器 */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Briefcase size={12} />
                            職業身分
                        </label>
                        <select
                            value={inputs.occupation}
                            onChange={(e) => onChange('occupation', e.target.value as Occupation)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                        >
                            {Object.entries(OCCUPATION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 動態薪資欄位 */}
                    <InputGroup
                        label={getSalaryLabel()}
                        name="currentSalary"
                        value={inputs.currentSalary}
                        onChange={onChange}
                        step={1000}
                    />

                    {/* 支柱一：社會保險參數 */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">支柱一：社會保險</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="累計年資 (年)"
                                name="pillar1Years"
                                value={inputs.pillar1Years}
                                onChange={onChange}
                                min={0}
                                max={50}
                            />
                            <InputGroup
                                label={getPillar1Label()}
                                name="pillar1InsuredAmount"
                                value={inputs.pillar1InsuredAmount}
                                onChange={onChange}
                                step={1000}
                            />
                        </div>
                    </div>

                    {/* 勞工專屬：勞退參數 */}
                    {isLabor && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <PiggyBank size={14} />
                                支柱二：勞退自提與投資
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="勞退專戶累積"
                                    name="pillar2Accumulated"
                                    value={inputs.pillar2Accumulated}
                                    onChange={onChange}
                                    step={10000}
                                />
                                <InputGroup
                                    label="個人自提率 (%)"
                                    name="pillar2RatePersonal"
                                    value={inputs.pillar2RatePersonal}
                                    onChange={onChange}
                                    step={1}
                                    min={0}
                                    max={6}
                                    tooltip="勞退自提可節稅，最高6%"
                                />
                            </div>
                            {/* 基金風險參數 */}
                            <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-2 rounded mt-2">
                                <InputGroup
                                    label="預期勞退報酬 (%)"
                                    name="pillar2ReturnRate"
                                    value={inputs.pillar2ReturnRate}
                                    onChange={onChange}
                                    step={0.5}
                                    min={0}
                                    max={15}
                                />
                                <InputGroup
                                    label="標準差(波動風險) %"
                                    name="pillar2StdDev"
                                    value={inputs.pillar2StdDev}
                                    onChange={onChange}
                                    step={0.5}
                                    min={0}
                                    max={30}
                                    tooltip="用於蒙地卡羅模擬，越低越保守"
                                />
                            </div>
                        </div>
                    )}

                    {/* 私校教職專屬：退撫儲金 */}
                    {isTeacher && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <PiggyBank size={14} />
                                支柱二：私校退撫儲金
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="退撫專戶累積"
                                    name="pillar2Accumulated"
                                    value={inputs.pillar2Accumulated}
                                    onChange={onChange}
                                    step={10000}
                                />
                                <InputGroup
                                    label="個人提繳率 (%)"
                                    name="pillar2RatePersonal"
                                    value={inputs.pillar2RatePersonal}
                                    onChange={onChange}
                                    step={0.5}
                                    min={0}
                                    max={15}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-2 rounded mt-2">
                                <InputGroup
                                    label="預期基金報酬 (%)"
                                    name="pillar2ReturnRate"
                                    value={inputs.pillar2ReturnRate}
                                    onChange={onChange}
                                    step={0.5}
                                />
                                <InputGroup
                                    label="標準差 %"
                                    name="pillar2StdDev"
                                    value={inputs.pillar2StdDev}
                                    onChange={onChange}
                                    step={0.5}
                                    tooltip="基金波動風險"
                                />
                            </div>
                        </div>
                    )}

                    {/* 公務員/軍人：確定給付制說明 */}
                    {(isCivil || isMilitary) && (
                        <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="text-xs text-green-700">
                                <strong>支柱二：</strong>
                                {isCivil && '公務員月退休金採確定給付制，系統將根據本俸與年資自動計算。'}
                                {isMilitary && '軍人退撫採終身俸制，系統將根據本俸與年資自動計算。'}
                            </p>
                        </div>
                    )}

                    {/* 國保：無支柱二 */}
                    {isNational && (
                        <div className="mt-4 bg-gray-100 p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600">
                                <strong>支柱二：</strong>國民年金無職業退休金制度，請加強支柱三個人準備。
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 3. 支柱三：個人投資 (含風險參數) */}
            <SectionHeader title="3. 個人準備 & 投資風險" isOpen={openSections.personal} toggle={() => toggle('personal')} />
            {openSections.personal && (
                <div className="p-4 bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup
                            label="已累積退休資產"
                            name="currentPersonalAssets"
                            value={inputs.currentPersonalAssets}
                            onChange={onChange}
                            step={10000}
                            tooltip="請排除自住房產"
                        />
                        <InputGroup
                            label="每月額外儲蓄"
                            name="monthlyPersonalSavings"
                            value={inputs.monthlyPersonalSavings}
                            onChange={onChange}
                            step={1000}
                        />
                    </div>

                    <InputGroup
                        label="退休後其他固定收入"
                        name="otherFixedIncome"
                        value={inputs.otherFixedIncome}
                        onChange={onChange}
                        step={1000}
                        tooltip="例如：租金收入、老農津貼等"
                    />

                    <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> 投資組合設定
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="預期年化報酬 (%)"
                                name="personalReturnRate"
                                value={inputs.personalReturnRate}
                                onChange={onChange}
                                step={0.5}
                                min={0}
                                max={20}
                            />
                            <InputGroup
                                label="標準差(風險) %"
                                name="personalStdDev"
                                value={inputs.personalStdDev}
                                onChange={onChange}
                                step={0.5}
                                min={0}
                                max={50}
                                tooltip="標準差越高，資產波動越大，耗盡風險越高"
                            />
                        </div>
                        <p className="text-xs text-indigo-600 mt-2">
                            💡 建議：保守型 3-5%/5-8%，穩健型 5-7%/10-15%，積極型 7-10%/15-20%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};