-- Restore Epaper Display layout to default structure
UPDATE layouts 
SET structure = '{
  "rows": [
    {
      "id": "row-1",
      "columns": [
        {
          "id": "col-1",
          "width": 12,
          "widgets": [
            {
              "id": "widget-display",
              "type": "epaper-display",
              "config": {
                "title": "",
                "enableNavigation": true,
                "enableZoom": true,
                "defaultZoom": 1
              }
            }
          ],
          "rows": []
        }
      ]
    }
  ]
}'::jsonb
WHERE name = 'Epaper Display';
