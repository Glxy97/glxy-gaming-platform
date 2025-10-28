export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { CreateRoomForm } from '@/components/rooms/CreateRoomForm'
import { RoomBrowser } from '@/components/rooms/RoomBrowser'
import { MatchmakingWidget } from '@/components/rooms/MatchmakingWidget'
import { JoinById } from '@/components/rooms/JoinById'


export default function RoomsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Räume & Matchmaking</h1>
      <div className="border rounded p-4 space-y-2">
        <JoinById />
      </div>
      <CreateRoomForm />
      <div>
        <h3 className="font-semibold mb-2">Matchmaking</h3>
        <MatchmakingWidget />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Öffentliche Räume</h3>
        <RoomBrowser />
      </div>
    </div>
  )
}
