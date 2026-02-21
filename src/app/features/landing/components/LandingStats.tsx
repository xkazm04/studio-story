import { useState } from "react";
import { Project } from "@/app/types/Project";

type Props = {
    project: Pick<Project, 'id' | 'name'> & {
        completion?: number;
        research?: number;
        editing?: number;
        planning?: number;
    };
}

const LandingStats = ({project}: Props) => {
      const [hoveredStat, setHoveredStat] = useState<string | null>(null);
      
    return <div className="grid grid-cols-2 gap-4 mb-auto" data-testid="project-stats">
      {/* Completion stat with interactive hover effect */}
      <div
        className={`relative p-4 rounded-lg text-center overflow-hidden transition-all duration-300 ease-out ${
          hoveredStat === 'completion' ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          background: 'rgba(30, 30, 40, 0.5)',
          boxShadow: hoveredStat === 'completion' ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
          transform: hoveredStat === 'completion' ? 'translateY(-2px)' : 'none'
        }}
        onMouseEnter={() => setHoveredStat('completion')}
        onMouseLeave={() => setHoveredStat(null)}
        data-testid="stat-completion"
      >
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out" 
          style={{
            width: `${project.completion ?? 0}%`,
            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(96, 165, 250))',
            opacity: hoveredStat === 'completion' ? 1 : 0.7
          }}
        ></div>
        <div className="text-2xl font-bold text-blue-400">{project.completion ?? 0}%</div>
        <div className="text-xs text-gray-400 mt-1">Completion</div>
      </div>
      
      {/* Research stat */}
      <div 
        className={`relative p-4 rounded-lg text-center overflow-hidden transition-all duration-300 ease-out ${
          hoveredStat === 'research' ? 'ring-2 ring-green-500' : ''
        }`}
        style={{
          background: 'rgba(30, 30, 40, 0.5)',
          boxShadow: hoveredStat === 'research' ? '0 0 15px rgba(34, 197, 94, 0.25)' : 'none',
          transform: hoveredStat === 'research' ? 'translateY(-2px)' : 'none'
        }}
        onMouseEnter={() => setHoveredStat('research')}
        onMouseLeave={() => setHoveredStat(null)}
      >
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out" 
          style={{
            width: `${project.research ?? 0}%`,
            background: 'linear-gradient(to right, #22c55e, #15803d)',
            opacity: hoveredStat === 'research' ? 1 : 0.7
          }}
        ></div>
        <div className="text-2xl font-bold text-green-400">{project.research ?? 0}%</div>
        <div className="text-xs text-gray-400 mt-1">Research</div>
      </div>
      
      {/* Editing stat */}
      <div 
        className={`relative p-4 rounded-lg text-center overflow-hidden transition-all duration-300 ease-out ${
          hoveredStat === 'editing' ? 'ring-2 ring-purple-500' : ''
        }`}
        style={{
          background: 'rgba(30, 30, 40, 0.5)',
          boxShadow: hoveredStat === 'editing' ? '0 0 15px rgba(168, 85, 247, 0.25)' : 'none',
          transform: hoveredStat === 'editing' ? 'translateY(-2px)' : 'none'
        }}
        onMouseEnter={() => setHoveredStat('editing')}
        onMouseLeave={() => setHoveredStat(null)}
      >
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out" 
          style={{
            width: `${project.editing ?? 0}%`,
            background: 'linear-gradient(to right, #a855f7, #7e22ce)',
            opacity: hoveredStat === 'editing' ? 1 : 0.7
          }}
        ></div>
        <div className="text-2xl font-bold text-purple-400">{project.editing ?? 0}%</div>
        <div className="text-xs text-gray-400 mt-1">Editing</div>
      </div>
      
      {/* Planning stat */}
      <div 
        className={`relative p-4 rounded-lg text-center overflow-hidden transition-all duration-300 ease-out ${
          hoveredStat === 'planning' ? 'ring-2 ring-yellow-500' : ''
        }`}
        style={{
          background: 'rgba(30, 30, 40, 0.5)',
          boxShadow: hoveredStat === 'planning' ? '0 0 15px rgba(234, 179, 8, 0.25)' : 'none',
          transform: hoveredStat === 'planning' ? 'translateY(-2px)' : 'none'
        }}
        onMouseEnter={() => setHoveredStat('planning')}
        onMouseLeave={() => setHoveredStat(null)}
      >
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out" 
          style={{
            width: `${project.planning ?? 0}%`,
            background: 'linear-gradient(to right, #eab308, #a16207)',
            opacity: hoveredStat === 'planning' ? 1 : 0.7
          }}
        ></div>
        <div className="text-2xl font-bold text-yellow-400">{project.planning ?? 0}%</div>
        <div className="text-xs text-gray-400 mt-1">Planning</div>
      </div>
    </div>
}

export default LandingStats;


