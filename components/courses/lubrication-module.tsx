'use client'

import { useState } from 'react'

export default function LubricationModule() {
  const [activeSection, setActiveSection] = useState(1)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-lg">
        <h1 className="text-3xl font-bold">🔧 Lubrication Engineering</h1>
        <p className="mt-2">Interactive Learning Module</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => setActiveSection(num)}
            className={`px-4 py-2 font-medium ${
              activeSection === num
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Section {num}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="p-6">
        {activeSection === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Introduction to Lubrication</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-semibold">Reduces Friction</h3>
                <p className="text-sm text-gray-600">Creates a thin film between moving parts</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">❄️</div>
                <h3 className="font-semibold">Cools Components</h3>
                <p className="text-sm text-gray-600">Carries away heat from friction</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">🛡️</div>
                <h3 className="font-semibold">Prevents Wear</h3>
                <p className="text-sm text-gray-600">Protects surfaces from damage</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Principles of Lubrication</h2>
            <div className="space-y-4">
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg">💧 Hydrodynamic Lubrication</h3>
                <p>Full fluid film separates surfaces completely</p>
              </div>
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg">⚙️ Boundary Lubrication</h3>
                <p>Thin molecular layer prevents metal-to-metal contact</p>
              </div>
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg">🔄 Mixed Lubrication</h3>
                <p>Combination of hydrodynamic and boundary lubrication</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Types of Lubricants</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border p-4 rounded-lg">
                <div className="text-2xl mb-2">💧</div>
                <h3 className="font-semibold">Oils</h3>
                <ul className="text-sm list-disc pl-4 mt-2">
                  <li>Mineral Oils</li>
                  <li>Synthetic Oils</li>
                  <li>Vegetable Oils</li>
                </ul>
              </div>
              <div className="border p-4 rounded-lg">
                <div className="text-2xl mb-2">🧈</div>
                <h3 className="font-semibold">Greases</h3>
                <ul className="text-sm list-disc pl-4 mt-2">
                  <li>Lithium Grease</li>
                  <li>Calcium Grease</li>
                  <li>High-Temp Grease</li>
                </ul>
              </div>
              <div className="border p-4 rounded-lg">
                <div className="text-2xl mb-2">⚫</div>
                <h3 className="font-semibold">Solid Lubricants</h3>
                <ul className="text-sm list-disc pl-4 mt-2">
                  <li>Graphite</li>
                  <li>Molybdenum Disulfide</li>
                  <li>PTFE (Teflon)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Add more sections as needed */}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <button
          onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
          disabled={activeSection === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          onClick={() => setActiveSection(Math.min(9, activeSection + 1))}
          disabled={activeSection === 9}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
