export interface KnowledgeData {
  meta: {
    extractedAt: string;
    totalSkills: number;
    totalAgents: number;
    totalReports: number;
    totalCourses: number;
    totalNotes: number;
    totalLectures: number;
    totalNodes?: number;
    totalEdges?: number;
  };
  skills: Skill[];
  agents: Agent[];
  reports: Report[];
  courses: Course[];
  notes: Note[];
  lectures: Lecture[];
  graph: GraphData;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  domain: Domain;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  domain: Domain;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  type: string;
  domain: Domain;
}

export interface Course {
  id: string;
  name: string;
  topics: string[];
}

export interface Note {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  domain: Domain;
  wikilinks: string[];
}

export interface Lecture {
  id: string;
  title: string;
  course: string;
  domain: Domain;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'skill' | 'agent' | 'report' | 'course' | 'note' | 'lecture';
  domain: Domain;
  connections: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  reason: string;
}

export type Domain =
  | 'ai'
  | 'fashion'
  | 'academic'
  | 'business'
  | 'career'
  | 'engineering'
  | 'meta';

export const DOMAIN_COLORS: Record<Domain, string> = {
  ai: '#4EA8FF',         // Vega blue
  fashion: '#FFB347',    // Arcturus gold
  academic: '#50E3A0',   // Aurora green
  business: '#B17EF5',   // Nebula violet
  career: '#FF7B6B',     // Mars coral
  engineering: '#47D4E8', // Rigel cyan
  meta: '#E878B8',       // Orion pink
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  ai: 'Artificial Intelligence',
  fashion: 'Fashion & Design',
  academic: 'Academic Research',
  business: 'Business & Strategy',
  career: 'Career Development',
  engineering: 'Software Engineering',
  meta: 'Meta Systems',
};

// Alias for forward compatibility
export type DomainId = Domain;
