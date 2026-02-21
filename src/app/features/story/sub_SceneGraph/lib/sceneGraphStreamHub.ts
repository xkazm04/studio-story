/**
 * Scene Graph Stream Hub
 * Central RxJS subject for reactive graph mutations
 */

import { Subject, BehaviorSubject, Observable } from 'rxjs';
import {
  throttleTime,
  debounceTime,
  filter,
  distinctUntilChanged,
  shareReplay,
  scan,
} from 'rxjs/operators';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import {
  GraphMutationEvent,
  GraphStateSnapshot,
  SelectionChangeEvent,
  createInitialSnapshot,
} from './graphStreamTypes';
import { reduceGraphState } from './graphStreamReducer';

class SceneGraphStreamHub {
  private static instance: SceneGraphStreamHub | null = null;

  private readonly mutationSubject = new Subject<GraphMutationEvent>();
  private readonly stateSubject: BehaviorSubject<GraphStateSnapshot>;

  public readonly mutations$: Observable<GraphMutationEvent>;
  public readonly state$: Observable<GraphStateSnapshot>;
  public readonly throttledMutations$: Observable<GraphMutationEvent>;
  public readonly debouncedMutations$: Observable<GraphMutationEvent>;
  public readonly sceneEvents$: Observable<GraphMutationEvent>;
  public readonly choiceEvents$: Observable<GraphMutationEvent>;
  public readonly selectionEvents$: Observable<SelectionChangeEvent>;
  public readonly structuralEvents$: Observable<GraphMutationEvent>;

  private constructor() {
    this.stateSubject = new BehaviorSubject<GraphStateSnapshot>(createInitialSnapshot());

    this.mutations$ = this.mutationSubject.asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.mutationSubject.pipe(
      scan(reduceGraphState, createInitialSnapshot())
    ).subscribe(state => this.stateSubject.next(state));

    this.state$ = this.stateSubject.asObservable().pipe(
      distinctUntilChanged((prev, curr) => prev.mutationCount === curr.mutationCount),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.throttledMutations$ = this.mutations$.pipe(
      throttleTime(100, undefined, { leading: true, trailing: true }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.debouncedMutations$ = this.mutations$.pipe(
      debounceTime(150),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.sceneEvents$ = this.mutations$.pipe(
      filter(e => e.type.startsWith('scene:')),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.choiceEvents$ = this.mutations$.pipe(
      filter(e => e.type.startsWith('choice:')),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.selectionEvents$ = this.mutations$.pipe(
      filter((e): e is SelectionChangeEvent => e.type === 'selection:change'),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.structuralEvents$ = this.mutations$.pipe(
      filter(e =>
        e.type.includes('add') ||
        e.type.includes('delete') ||
        e.type === 'graph:reset' ||
        e.type === 'graph:sync' ||
        e.type === 'collapse:toggle'
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  static getInstance(): SceneGraphStreamHub {
    if (!SceneGraphStreamHub.instance) {
      SceneGraphStreamHub.instance = new SceneGraphStreamHub();
    }
    return SceneGraphStreamHub.instance;
  }

  // Scene emitters
  emitSceneAdd(scene: Scene): void {
    this.mutationSubject.next({ type: 'scene:add', payload: scene, timestamp: Date.now() });
  }

  emitSceneUpdate(sceneId: string, updates: Partial<Scene>): void {
    this.mutationSubject.next({
      type: 'scene:update',
      payload: { sceneId, updates },
      timestamp: Date.now(),
    });
  }

  emitSceneDelete(sceneId: string): void {
    this.mutationSubject.next({
      type: 'scene:delete',
      payload: { sceneId },
      timestamp: Date.now(),
    });
  }

  emitSceneBatchAdd(scenes: Scene[]): void {
    this.mutationSubject.next({ type: 'scene:batch-add', payload: scenes, timestamp: Date.now() });
  }

  // Choice emitters
  emitChoiceAdd(choice: SceneChoice): void {
    this.mutationSubject.next({ type: 'choice:add', payload: choice, timestamp: Date.now() });
  }

  emitChoiceUpdate(choiceId: string, updates: Partial<SceneChoice>): void {
    this.mutationSubject.next({
      type: 'choice:update',
      payload: { choiceId, updates },
      timestamp: Date.now(),
    });
  }

  emitChoiceDelete(choiceId: string): void {
    this.mutationSubject.next({
      type: 'choice:delete',
      payload: { choiceId },
      timestamp: Date.now(),
    });
  }

  // Graph emitters
  emitGraphReset(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null,
    currentSceneId: string | null
  ): void {
    this.mutationSubject.next({
      type: 'graph:reset',
      payload: { scenes, choices, firstSceneId, currentSceneId },
      timestamp: Date.now(),
    });
  }

  emitGraphSync(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null,
    currentSceneId: string | null,
    collapsedNodes: Set<string>
  ): void {
    this.mutationSubject.next({
      type: 'graph:sync',
      payload: { scenes, choices, firstSceneId, currentSceneId, collapsedNodes },
      timestamp: Date.now(),
    });
  }

  emitSelectionChange(sceneId: string | null): void {
    this.mutationSubject.next({
      type: 'selection:change',
      payload: { sceneId },
      timestamp: Date.now(),
    });
  }

  emitCollapseToggle(nodeId: string, collapsed: boolean): void {
    this.mutationSubject.next({
      type: 'collapse:toggle',
      payload: { nodeId, collapsed },
      timestamp: Date.now(),
    });
  }

  // State accessors
  getCurrentState(): GraphStateSnapshot {
    return this.stateSubject.getValue();
  }

  getScenes(): Scene[] {
    return Array.from(this.stateSubject.getValue().scenes.values());
  }

  getChoices(): SceneChoice[] {
    return Array.from(this.stateSubject.getValue().choices.values());
  }

  reset(): void {
    this.stateSubject.next(createInitialSnapshot());
  }
}

export const getSceneGraphStreamHub = () => SceneGraphStreamHub.getInstance();
export type { SceneGraphStreamHub };
