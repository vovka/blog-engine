import ReactMarkdown from 'react-markdown';
import { markdownRemarkPlugins, markdownRehypePlugins, markdownComponents } from './markdownConfig';

function DialoguePair({ primary, opponent, showOpponent }) {
  const className = `dialogue-pair${showOpponent ? '' : ' dialogue-pair--collapsed'}`;

  return (
    <div className={className}>
      <div className="dialogue-primary">
        <ReactMarkdown
          remarkPlugins={markdownRemarkPlugins}
          rehypePlugins={markdownRehypePlugins}
          components={markdownComponents}
        >
          {primary}
        </ReactMarkdown>
      </div>

      {showOpponent && (
        <div className="dialogue-opponent">
          <ReactMarkdown
            remarkPlugins={markdownRemarkPlugins}
            rehypePlugins={markdownRehypePlugins}
            components={markdownComponents}
          >
            {opponent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default DialoguePair;
