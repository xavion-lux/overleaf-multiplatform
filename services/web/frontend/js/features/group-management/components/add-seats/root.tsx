import useWaitForI18n from '../../../../shared/hooks/use-wait-for-i18n'
import AddSeats from '@/features/group-management/components/add-seats/add-seats'

function Root() {
  const { isReady } = useWaitForI18n()

  if (!isReady) {
    return null
  }

  return <AddSeats />
}

export default Root
