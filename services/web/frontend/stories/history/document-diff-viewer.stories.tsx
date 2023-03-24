import { ScopeDecorator } from '../decorators/scope'
import DocumentDiffViewer, {
  Highlight,
} from '../../js/features/history/components/editor/document-diff-viewer'
import React from 'react'

export default {
  title: 'History / Document Diff Viewer',
  component: DocumentDiffViewer,
  decorators: [
    ScopeDecorator,
    (Story: React.ComponentType) => (
      <div style={{ height: '90vh' }}>
        <Story />
      </div>
    ),
  ],
}

export const Highlights = () => {
  return <DocumentDiffViewer doc={content} highlights={highlights} />
}

const highlights: Highlight[] = [
  {
    type: 'addition',
    range: { from: 3, to: 10 },
    hue: 200,
    label: 'Added by Wombat on Monday',
  },
  {
    type: 'deletion',
    range: { from: 15, to: 25 },
    hue: 200,
    label: 'Deleted by Wombat on Monday',
  },
  {
    type: 'addition',
    range: { from: 100, to: 400 },
    hue: 200,
    label: 'Added by Wombat on Friday',
  },
]

const content = `\\documentclass{article}

% Language setting
% Replace \`english' with e.g. \`spanish' to change the document language
\\usepackage[english]{babel}

% Set page size and margins
% Replace \`letterpaper' with \`a4paper' for UK/EU standard size
\\usepackage[letterpaper,top=2cm,bottom=2cm,left=3cm,right=3cm,marginparwidth=1.75cm]{geometry}

% Useful packages
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage[colorlinks=true, allcolors=blue]{hyperref}

\\title{Your Paper}
\\author{You}

\\begin{document}
\\maketitle

\\begin{abstract}
Your abstract.
\\end{abstract}

\\section{Introduction}

Your introduction goes here! Simply start writing your document and use the Recompile button to view the updated PDF preview. Examples of commonly used commands and features are listed below, to help you get started.

Once you're familiar with the editor, you can find various project settings in the Overleaf menu, accessed via the button in the very top left of the editor. To view tutorials, user guides, and further documentation, please visit our \\href{https://www.overleaf.com/learn}{help library}, or head to our plans page to \\href{https://www.overleaf.com/user/subscription/plans}{choose your plan}.

\\begin{enumerate}
    \\item The labels consists of sequential numbers
    \\begin{itemize}
        \\item The individual entries are indicated with a black dot, a so-called bullet
        \\item The text in the entries may be of any length
        \\begin{description}
            \\item[Note:] I would like to describe something here
            \\item[Caveat!] And give a warning
        \\end{description}
    \\end{itemize}
    \\item The numbers starts at 1 with each use of the \\text{enumerate} environment
\\end{enumerate}

\\bibliographystyle{alpha}
\\bibliography{sample}

\\end{document}`
