export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          id: string
          redeemed_at: string
          reward_id: string | null
          time_spent: number
          user_id: string | null
        }
        Insert: {
          id?: string
          redeemed_at?: string
          reward_id?: string | null
          time_spent: number
          user_id?: string | null
        }
        Update: {
          id?: string
          redeemed_at?: string
          reward_id?: string | null
          time_spent?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          base_time: number
          created_at: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          base_time: number
          created_at?: string
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          base_time?: number
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tasks: {
        Row: {
          created_at: string
          duration: number
          id: string
          position: number
          routine_id: string | null
          title: string
          type: Database["public"]["Enums"]["task_type"] | null
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          position: number
          routine_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["task_type"] | null
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          position?: number
          routine_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["task_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_tasks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          task_title: string
          time_saved: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          id?: string
          task_title: string
          time_saved: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          task_title?: string
          time_saved?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_type: "regular" | "focus"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
