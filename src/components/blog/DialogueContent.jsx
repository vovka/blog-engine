import ReactMarkdown from 'react-markdown';
import { splitDialogueBlocks } from '../../utils/splitDialogueBlocks';
import { markdownRemarkPlugins, markdownRehypePlugins, markdownComponents } from './markdownConfig';
import DialoguePair from './DialoguePair';

function DialogueContent({ content, showOpponent }) {
  const segments = splitDialogueBlocks(content);

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'dialogue' ? (
          <DialoguePair
            key={index}
            primary={segment.primary}
            opponent={segment.opponent}
            showOpponent={showOpponent}
          />
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={markdownRemarkPlugins}
            rehypePlugins={markdownRehypePlugins}
            components={markdownComponents}
          >
            {segment.content}
          </ReactMarkdown>
        )
      )}
    </>
  );
}

export default DialogueContent;
