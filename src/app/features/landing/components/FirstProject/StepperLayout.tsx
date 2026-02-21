'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StepperNav from "./StepperNav";
import { narratorMaleSelection, narratorFemaleSelection, projectTypes, templateSelection } from "@/app/constants/landingCards";
import StepperOverview from "./StepperOverview";
import StepperItem from "./StepperItem";
import StepperAITemplate from "./StepperAITemplate";
import { projectApi } from "@/app/hooks/integration/useProjects";
import { MOCK_USER_ID } from "@/app/config/mockUser";
import { ProjectTemplate } from "@/app/constants/templateCorpus";
import { ConfettiCelebration } from "@/app/components/UI/ConfettiCelebration";
import { useToast } from "@/app/components/UI/ToastContainer";

type Objective = {
  id: string;
  name: string;
};

type Character = {
  id: string;
  name: string;
  type: "protagonist" | "antagonist" | "neutral";
};

const useViewportSize = () => {
  const [size, setSize] = useState({ height: 0, width: 0 });
  useEffect(() => {
    const updateSize = () => {
      setSize({
        height: window.innerHeight,
        width: window.innerWidth
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
};

type Props = {
  setShowGuide: (show: boolean) => void;
  userId?: string;
}

const StepperLayout = ({ setShowGuide, userId = MOCK_USER_ID }: Props) => {
  const createProjectMutation = projectApi.useCreateProject();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [narratorSelection, setNarratorSelection] = useState(narratorMaleSelection);
  const [selections, setSelections] = useState({
    projectType: null as string | null,
    narrator: null as string | null,
    template: null as string | null,
    genre: null as string | null,
  });
  const [genderPreference, setGenderPreference] = useState('male');
  const { height: viewportHeight } = useViewportSize();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [objectives, setObjectives] = useState<Objective[]>([{ id: "obj-1", name: "" }]);
  const [characters, setCharacters] = useState<Character[]>([
    { id: "char-1", name: "", type: "protagonist" }
  ]);
  const [useAITemplate, setUseAITemplate] = useState(false);
  const [aiTemplateGenerated, setAiTemplateGenerated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);


  useEffect(() => {
    if (containerRef.current && viewportHeight > 0) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const containerTop = containerRef.current.getBoundingClientRect().top;
          const availableHeight = viewportHeight - containerTop - 120;
          setContainerHeight(availableHeight);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [viewportHeight, currentStep]);

  const steps = [
    { id: 1, title: "Select type", items: projectTypes },
    { id: 2, title: "Narrator", items: narratorSelection },
    { id: 3, title: "Template", items: templateSelection },
    { id: 4, title: useAITemplate ? "AI Template Generator" : "Project overview", items: [] }
  ];

  // Get current step data
  const currentStepData = steps.find(step => step.id === currentStep);

  const handleGenderSwitch = (gender: string) => {
    if (gender === 'male' && genderPreference !== 'male') {
      setGenderPreference('male');
      setNarratorSelection(narratorMaleSelection);
      setSelections({ ...selections, narrator: null });
    } else if (gender === 'female' && genderPreference !== 'female') {
      setGenderPreference('female');
      setNarratorSelection(narratorFemaleSelection);
      setSelections({ ...selections, narrator: null });
    }
  };

  const handleTemplateGenerated = (template: ProjectTemplate) => {
    // Apply template to project
    setProjectName(template.name);
    setProjectDescription(template.description);

    // Convert template characters to project characters
    const templateChars = template.characters.map((char, idx) => ({
      id: `char-${idx + 1}`,
      name: char.name,
      type: char.type
    }));
    if (templateChars.length > 0) {
      setCharacters(templateChars);
    }

    // Convert template objectives to project objectives
    const templateObjs = template.objectives.map((obj, idx) => ({
      id: `obj-${idx + 1}`,
      name: obj.name
    }));
    if (templateObjs.length > 0) {
      setObjectives(templateObjs);
    }

    setAiTemplateGenerated(true);
    setCurrentStep(5); // Move to overview step (will be created as step 5)
  };

  const handleSkipAITemplate = () => {
    setUseAITemplate(false);
    setCurrentStep(5); // Move to overview step
  };

  const handleProjectCreate = () => {
    createProjectMutation.mutate(
      {
        name: projectName,
        user_id: userId,
        description: projectDescription,
        type: selections.projectType || 'story',
      },
      {
        onSuccess: () => {
          console.log('Project created successfully!');

          // Trigger confetti celebration
          setShowConfetti(true);

          // Show success toast with celebration message
          showToast('New adventure unlocked!', 'success', 3000);

          // Close guide after a brief delay to allow confetti to display
          setTimeout(() => {
            setShowGuide(false);
          }, 1500);
        },
        onError: () => {
          console.error('Error creating project:');
          showToast('Failed to create project. Please try again.', 'error', 4000);
        }
      }
    );
  }


  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-2 flex flex-col" style={{ height: '100vh' }}>
      {/* Confetti Celebration */}
      <ConfettiCelebration trigger={showConfetti} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-4 flex flex-col grow"
          ref={containerRef}
        >
          <div className="flex flex-row justify-between w-full pb-3">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-blue-400">
                {currentStepData?.title}
              </h2>
            </div>
            {currentStep === 2 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenderSwitch('male')}
                  className={`px-4 py-2 rounded-lg transition ${
                    genderPreference === 'male'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => handleGenderSwitch('female')}
                  className={`px-4 py-2 rounded-lg transition ${
                    genderPreference === 'female'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Female
                </button>
              </div>
            )}
          </div>

          {/* Conditional Rendering: Grid layout for steps 1-3, Form layout for step 4 */}
          {currentStep < 4 ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grow"
              style={{
                minHeight: '200px',
                height: containerHeight > 0 ? `${containerHeight}px` : 'auto',
                maxHeight: '70vh'
              }}
            >
              {currentStepData?.items.map((item) => (
                <StepperItem
                  key={item.id}
                  item={item}
                  currentStep={currentStep}
                  setSelections={setSelections}
                  selections={selections}
                  genderPreference={genderPreference}
                />
              ))}
            </div>
          ) : (
            <div
              className="grow overflow-y-auto"
              style={{
                minHeight: '200px',
                height: containerHeight > 0 ? `${containerHeight}px` : 'auto',
                maxHeight: '70vh'
              }}
            >
              <StepperOverview
                selections={selections}
                projectTypes={projectTypes}
                narratorSelection={narratorSelection}
                templateSelection={templateSelection}
                projectName={projectName}
                setProjectName={setProjectName}
                projectDescription={projectDescription}
                setProjectDescription={setProjectDescription}
                objectives={objectives}
                setObjectives={setObjectives}
                characters={characters}
                setCharacters={setCharacters}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <StepperNav
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={steps}
        selections={selections}
        setShowGuide={setShowGuide}
        projectName={projectName}
        projectDescription={projectDescription}
        handleProjectCreate={handleProjectCreate} 
      />
    </div>
  );
};

export default StepperLayout;

