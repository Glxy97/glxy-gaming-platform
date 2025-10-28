import React from 'react'
import MilitaryTacticalScene from '@/components/games/fps/MilitaryTacticalScene'
import { Metadata } from 'next'


export default function MilitaryTacticalPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <MilitaryTacticalScene />
    </div>
  )
}