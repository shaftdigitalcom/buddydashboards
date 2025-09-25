export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      kommo_connections: {
        Row: {
          id: string;
          user_id: string;
          account_domain: string;
          auth_type: "token" | "oauth";
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_domain: string;
          auth_type?: "token" | "oauth";
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_domain?: string;
          auth_type?: "token" | "oauth";
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kommo_connections_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      widgets: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          position: number;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          position: number;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          position?: number;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "widgets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      lead_stage_events: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string | null;
          lead_id: string;
          pipeline_id: string;
          stage_id: string;
          entered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id?: string | null;
          lead_id: string;
          pipeline_id: string;
          stage_id: string;
          entered_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string | null;
          lead_id?: string;
          pipeline_id?: string;
          stage_id?: string;
          entered_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_stage_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_stage_events_connection_id_fkey";
            columns: ["connection_id"];
            referencedRelation: "kommo_connections";
            referencedColumns: ["id"];
          }
        ];
      };
      metrics_cache: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string | null;
          cache_key: string;
          payload: Json;
          ttl_expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id?: string | null;
          cache_key: string;
          payload: Json;
          ttl_expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string | null;
          cache_key?: string;
          payload?: Json;
          ttl_expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "metrics_cache_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metrics_cache_connection_id_fkey";
            columns: ["connection_id"];
            referencedRelation: "kommo_connections";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      [_ in never]: never;
    };
  };
}
