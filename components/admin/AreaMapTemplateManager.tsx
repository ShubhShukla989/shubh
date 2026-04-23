'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Edit, Trash2, X } from 'lucide-react';

interface AreaMap {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  linked_area_ids?: number[];
}

interface Template {
  id: string;
  name: string;
  pageNumber: number;
  createdAt: string;
  areaMaps: AreaMap[];
}

interface Props {
  currentPageNumber: number;
  currentAreaMaps: AreaMap[];
  onImportTemplate: (areaMaps: AreaMap[]) => void;
}

export default function AreaMapTemplateManager({ 
  currentPageNumber, 
  currentAreaMaps, 
  onImportTemplate 
}: Props) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportTitle, setExportTitle] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editName, setEditName] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('areaMapTemplates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      // Failed to load templates - silent fail
    }
  };

  const saveTemplates = (newTemplates: Template[]) => {
    try {
      localStorage.setItem('areaMapTemplates', JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      alert('Failed to save template!');
    }
  };

  // Export current page area maps
  const handleExport = () => {
    if (!exportTitle.trim()) {
      alert('Please enter a backup title!');
      return;
    }

    if (currentAreaMaps.length === 0) {
      alert('No area maps to export on this page!');
      return;
    }

    const newTemplate: Template = {
      id: `template_${Date.now()}`,
      name: exportTitle.trim(),
      pageNumber: currentPageNumber,
      createdAt: new Date().toISOString(),
      areaMaps: currentAreaMaps.map(area => ({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        title: area.title,
        url: area.url,
        linked_area_ids: area.linked_area_ids || []
      }))
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);

    alert(`Template "${exportTitle}" saved successfully with ${currentAreaMaps.length} area maps!`);
    setExportTitle('');
    setShowExportModal(false);
    setShowImportModal(false); // Close the main import modal as well
  };

  // Import template
  const handleImport = (template: Template) => {
    if (currentAreaMaps.length > 0) {
      if (!confirm(`This page already has ${currentAreaMaps.length} area maps. Replace them with ${template.areaMaps.length} area maps from template "${template.name}"?`)) {
        return;
      }
    }

    onImportTemplate(template.areaMaps);
    setShowImportModal(false);
    alert(`Successfully imported ${template.areaMaps.length} area maps from template "${template.name}"!\n\nDon't forget to click "Save All Area Maps" to save them.`);
  };

  // Edit template name
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setEditName(template.name);
  };

  const saveEditedTemplate = () => {
    if (!editName.trim()) {
      alert('Please enter a template name!');
      return;
    }

    if (!editingTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: editName.trim() }
        : t
    );

    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setEditName('');
    alert('Template name updated successfully!');
  };

  // Delete template
  const handleDeleteTemplate = (template: Template) => {
    if (confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
      const updatedTemplates = templates.filter(t => t.id !== template.id);
      saveTemplates(updatedTemplates);
      alert(`Template "${template.name}" deleted successfully!`);
    }
  };

  return (
    <>
      {/* Import/Export Button */}
      <button
        onClick={() => setShowImportModal(true)}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 text-sm font-medium"
      >
        📋 Import/Export Area Maps
      </button>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Export & Backup Maps</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Map Backup Title
              </label>
              <input
                type="text"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., HINDI PAGE 1"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                This will save {currentAreaMaps.length} area maps from Page {currentPageNumber}
              </p>
            </div>

            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Import/Export Area Maps</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setShowExportModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Maps
                </button>
                <button
                  onClick={() => {
                    const updatedTemplates: Template[] = [];
                    saveTemplates(updatedTemplates);
                    alert('All templates deleted successfully!');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete All
                </button>
              </div>

              {/* Templates Table */}
              <div className="border border-gray-200 rounded">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Page</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Maps</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No saved templates found. Export some area maps to get started!
                        </td>
                      </tr>
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="border-t border-gray-200">
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleImport(template)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                                title="Import"
                              >
                                <Upload className="w-3 h-3" />
                                Import
                              </button>
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{template.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Page {template.pageNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{template.areaMaps.length}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Name Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Edit</h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Map Backup Title
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setEditingTemplate(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}