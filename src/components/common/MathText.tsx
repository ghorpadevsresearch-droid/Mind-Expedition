import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathTextProps {
  text?: string | null;
  className?: string;
}

const MATH_TOKEN_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;
const SUP_SUB_REGEX = /<(sup|sub)>([\s\S]*?)<\/\1>/gi;

export const hasMathMarkup = (text?: string | null): boolean => {
  if (!text) return false;
  return (
    /\$[^\$\n]+?\$/.test(text) ||
    /\$\$[\s\S]+?\$\$/.test(text) ||
    /\\\([\s\S]+?\\\)/.test(text) ||
    /\\\[[\s\S]+?\\\]/.test(text) ||
    /<(sup|sub)>[\s\S]*?<\/\1>/i.test(text)
  );
};

const KatexNode: React.FC<{ expr: string; displayMode: boolean }> = ({ expr, displayMode }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(expr, el, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
      });
    } catch {
      el.textContent = expr;
    }
  }, [expr, displayMode]);

  return (
    <span
      ref={ref}
      className={
        displayMode
          ? 'block my-1.5 overflow-x-auto max-w-full align-middle'
          : 'inline-block align-baseline max-w-full'
      }
    />
  );
};

const renderSupSubSegments = (segment: string, keyPrefix: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  SUP_SUB_REGEX.lastIndex = 0;

  while ((match = SUP_SUB_REGEX.exec(segment)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(segment.slice(lastIndex, match.index));
    }
    const tag = match[1].toLowerCase();
    const inner = match[2];
    const children = renderSupSubSegments(inner, `${keyPrefix}-n${match.index}`);
    if (tag === 'sup') {
      nodes.push(
        <sup
          key={`${keyPrefix}-sup-${match.index}`}
          className="text-[0.72em] leading-none font-bold align-super px-[0.5px]"
        >
          {children}
        </sup>
      );
    } else {
      nodes.push(
        <sub
          key={`${keyPrefix}-sub-${match.index}`}
          className="text-[0.72em] leading-none font-bold align-sub px-[0.5px]"
        >
          {children}
        </sub>
      );
    }
    lastIndex = SUP_SUB_REGEX.lastIndex;
  }

  if (lastIndex < segment.length) {
    nodes.push(segment.slice(lastIndex));
  }

  return nodes;
};

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const parts = text.split(MATH_TOKEN_REGEX);

  return (
    <span className={`math-text-root ${className}`}>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          return <KatexNode key={`m-${idx}`} expr={part.slice(2, -2).trim()} displayMode={true} />;
        }
        if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
          return <KatexNode key={`m-${idx}`} expr={part.slice(2, -2).trim()} displayMode={true} />;
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          return <KatexNode key={`m-${idx}`} expr={part.slice(1, -1).trim()} displayMode={false} />;
        }
        if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
          return <KatexNode key={`m-${idx}`} expr={part.slice(2, -2).trim()} displayMode={false} />;
        }

        return <React.Fragment key={`t-${idx}`}>{renderSupSubSegments(part, `p${idx}`)}</React.Fragment>;
      })}
    </span>
  );
};
