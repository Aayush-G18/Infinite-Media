import { ReloadIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"

export default function ButtonLoading({loading,children,...props}) {
  return (
    <Button {...props} disabled={loading}>
      {loading?(
        <>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </>):(children)}

    </Button>
  )
}
