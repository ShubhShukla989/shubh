export interface Database {
  public: {
    Tables: {
      layouts: {
        Row: {
          id: string;
          name: string;
          structure: any;
          custom_css: string | null;
          custom_js: string | null;
          status: 'draft' | 'published';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['layouts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['layouts']['Insert']>;
      };
      layout_backups: {
        Row: {
          id: string;
          layout_name: string;
          structure: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['layout_backups']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['layout_backups']['Insert']>;
      };
    };
  };
}
