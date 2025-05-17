// "use client"

// import { useState } from "react"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"

// interface TestModeButtonProps {
//   onToggle: (enabled: boolean) => void
//   isEnabled: boolean
// }

// export default function TestModeButton({ onToggle, isEnabled }: TestModeButtonProps) {
//   const [checked, setChecked] = useState(isEnabled)

//   const handleToggle = () => {
//     setChecked(!checked)
//     onToggle(!checked)
//   }

//   return (
//     <div className="flex items-center space-x-2">
//       <Switch id="test-mode" checked={checked} onCheckedChange={handleToggle} />
//       <Label htmlFor="test-mode">Chế độ kiểm thử</Label>
//     </div>
//   )
// }
