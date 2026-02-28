import { useNavigate } from 'react-router-dom';

interface LabCardProps {
    title: string;
    description: string;
    tag: string;
    color: 'purple' | 'orange' | 'green' | 'blue';
    imagePath?: string;
    linkTo: string;
}

export default function LabCard({ title, description, tag, color, imagePath, linkTo }: LabCardProps) {
    const navigate = useNavigate();

    const colorStyles = {
        purple: "bg-purple-500/20 text-purple-300 border-purple-500/30 group-hover:border-purple-500",
        orange: "bg-orange-500/20 text-orange-300 border-orange-500/30 group-hover:border-orange-500",
        green: "bg-green-500/20 text-green-300 border-green-500/30 group-hover:border-green-500",
        blue: "bg-blue-500/20 text-blue-300 border-blue-500/30 group-hover:border-blue-500"
    }[color] || "bg-gray-500/20 text-gray-300 border-gray-500/30 group-hover:border-gray-500";

    return (
        <div
            onClick={() => linkTo.startsWith('http') ? window.open(linkTo, '_blank') : navigate(linkTo)}
            className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer bg-[#111621] shadow-md border border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
        >
            {imagePath ? (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${imagePath})` }}
                />
            ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-600 font-bold uppercase tracking-widest text-sm">Preview</span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-black/80 group-hover:from-gray-900/70 group-hover:to-black/60 transition-colors duration-500"></div>

            <div className="absolute bottom-0 left-0 p-6 z-20 w-full flex flex-col justify-end h-full">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 border ${colorStyles} transition-colors text-[10px] font-bold uppercase rounded tracking-wide backdrop-blur-sm`}>
                        {tag}
                    </span>
                </div>
                <h3 className="text-white font-bold text-xl mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 group-hover:text-gray-200 transition-colors">
                    {description}
                </p>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-colors pointer-events-none"></div>
        </div>
    );
}
