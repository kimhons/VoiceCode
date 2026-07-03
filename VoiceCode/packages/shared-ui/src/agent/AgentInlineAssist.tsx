/**
 * AgentInlineAssist - Small [✨ AI] button for form fields
 * Non-disruptive inline assistance
 */

import React, { useState } from 'react';

interface AgentInlineAssistProps {
  fieldName: string;
  fieldValue?: string;
  context?: Record<string, any>;
  onGenerate: (
    fieldName: string,
    context?: Record<string, any>
  ) => Promise<string>;
  onValueChange: (value: string) => void;
  position?: 'inside' | 'outside';
  size?: 'sm' | 'md';
}

export const AgentInlineAssist: React.FC<AgentInlineAssistProps> = ({
  fieldName,
  fieldValue,
  context = {},
  onGenerate,
  onValueChange,
  position = 'inside',
  size = 'sm',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const generated = await onGenerate(fieldName, {
        ...context,
        currentValue: fieldValue,
      });
      onValueChange(generated);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    sm: { padding: '4px 8px', fontSize: '11px', gap: '4px' },
    md: { padding: '6px 10px', fontSize: '12px', gap: '6px' },
  };

  const styles: Record<string, React.CSSProperties> = {
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeStyles[size].gap,
      padding: sizeStyles[size].padding,
      fontSize: sizeStyles[size].fontSize,
      fontWeight: 500,
      backgroundColor: isHovered ? '#6366f1' : '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: isLoading ? 'wait' : 'pointer',
      transition: 'all 0.15s ease',
      opacity: isLoading ? 0.7 : 1,
    },
    spinner: {
      width: '10px',
      height: '10px',
      border: '2px solid transparent',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    },
  };

  return (
    <button
      style={styles.button}
      onClick={handleGenerate}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Generate ${fieldName} with AI`}
    >
      {isLoading ? <span style={styles.spinner} /> : <span>✨</span>}
      AI
    </button>
  );
};

/**
 * AgentFieldWrapper - Wraps a form field with AI assistance
 */
interface AgentFieldWrapperProps {
  label: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  context?: Record<string, any>;
  onGenerate: (
    fieldName: string,
    context?: Record<string, any>
  ) => Promise<string>;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export const AgentFieldWrapper: React.FC<AgentFieldWrapperProps> = ({
  label,
  fieldName,
  value,
  onChange,
  context,
  onGenerate,
  multiline = false,
  rows = 4,
  placeholder,
}) => {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      marginBottom: '16px',
    },
    labelRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '6px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#e5e7eb',
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      paddingRight: '60px',
      fontSize: '14px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      color: '#fff',
      outline: 'none',
      resize: 'vertical' as const,
    },
    assistButton: {
      position: 'absolute',
      right: '8px',
      top: '8px',
    },
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <label style={styles.label}>{label}</label>
      </div>
      <div style={styles.inputWrapper}>
        <InputComponent
          style={{
            ...styles.input,
            ...(multiline ? { minHeight: `${rows * 24}px` } : {}),
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
        />
        <div style={styles.assistButton}>
          <AgentInlineAssist
            fieldName={fieldName}
            fieldValue={value}
            context={context}
            onGenerate={onGenerate}
            onValueChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentInlineAssist;
