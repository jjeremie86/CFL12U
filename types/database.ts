export type Side = "offense" | "defense";
export type EventKind = "practice" | "game";

export type Player = {
  id: string;
  jersey_number: string;
  jersey_sort: number;
  name: string;
  position: string;
  created_at: string;
  updated_at: string;
};

export type TeamEvent = {
  id: string;
  kind: EventKind;
  title: string;
  opponent: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: string;
  event_id: string;
  player_id: string;
  present: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  updated_at: string;
};

export type DepthChartSlot = {
  id: string;
  side: Side;
  slot_label: string;
  slot_order: number;
  player_id: string | null;
  updated_at: string;
};

type PlayerInsert = Partial<Player> & { jersey_number: string; name: string; position: string };
type TeamEventInsert = Partial<TeamEvent> & { kind: EventKind; title: string; event_date: string };
type AttendanceInsert = Partial<Attendance> & { event_id: string; player_id: string };
type DepthChartSlotInsert = Partial<DepthChartSlot> & { side: Side; slot_label: string };

export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: PlayerInsert;
        Update: Partial<Player>;
        Relationships: [];
      };
      events: {
        Row: TeamEvent;
        Insert: TeamEventInsert;
        Update: Partial<TeamEvent>;
        Relationships: [];
      };
      attendance: {
        Row: Attendance;
        Insert: AttendanceInsert;
        Update: Partial<Attendance>;
        Relationships: [];
      };
      depth_chart_slots: {
        Row: DepthChartSlot;
        Insert: DepthChartSlotInsert;
        Update: Partial<DepthChartSlot>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
