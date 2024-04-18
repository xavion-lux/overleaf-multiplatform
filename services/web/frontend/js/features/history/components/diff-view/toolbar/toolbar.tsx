import type { Nullable } from '../../../../../../../types/utils'
import type { Diff } from '../../../services/types/doc'
import type { HistoryContextValue } from '../../../context/types/history-context-value'
import ToolbarDatetime from './toolbar-datetime'
import ToolbarFileInfo from './toolbar-file-info'
import ToolbarRestoreFileButton from './toolbar-restore-file-button'
import { isFileRemoved } from '../../../utils/file-diff'
import ToolbarRevertFileButton from './toolbar-revert-file-button'
import { useSplitTestContext } from '@/shared/context/split-test-context'

type ToolbarProps = {
  diff: Nullable<Diff>
  selection: HistoryContextValue['selection']
}

export default function Toolbar({ diff, selection }: ToolbarProps) {
  const { splitTestVariants } = useSplitTestContext()

  const showRestoreFileButton =
    selection.selectedFile && isFileRemoved(selection.selectedFile)

  const showRevertFileButton =
    splitTestVariants['revert-file'] === 'enabled' &&
    selection.selectedFile &&
    !isFileRemoved(selection.selectedFile)

  return (
    <div className="history-react-toolbar">
      <ToolbarDatetime selection={selection} />
      {selection.selectedFile?.pathname ? (
        <ToolbarFileInfo diff={diff} selection={selection} />
      ) : null}
      {showRestoreFileButton ? (
        <ToolbarRestoreFileButton selection={selection} />
      ) : null}
      {showRevertFileButton ? (
        <ToolbarRevertFileButton selection={selection} />
      ) : null}
    </div>
  )
}
