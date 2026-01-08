/**
 * Interactive Savings Calculator Component
 * Allows users to calculate how much they'll save by switching to VoiceFlow Pro
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, Calculator } from 'lucide-react';

interface SavingsCalculatorProps {
  isMobile?: boolean;
  colors?: any;
  spacing?: any;
  typography?: any;
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({
  isMobile,
  colors = {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#667eea',
    border: '#e5e7eb',
  },
  spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography = {
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
}) => {
  const [hoursPerMonth, setHoursPerMonth] = useState(20);
  const [selectedCompetitor, setSelectedCompetitor] = useState<'otter' | 'rev' | 'descript'>('otter');
  const [savings, setSavings] = useState({ monthly: 0, yearly: 0 });

  const competitors = {
    otter: { name: 'Otter.ai', price: 16.99, limit: 20, overageRate: 0.14 },
    rev: { name: 'Rev.com', price: 29.99, limit: 0, overageRate: 0.50 },
    descript: { name: 'Descript', price: 24.00, limit: 10, overageRate: 0.40 },
  };

  useEffect(() => {
    const competitor = competitors[selectedCompetitor];
    let competitorCost = competitor.price;

    // Calculate overage costs
    if (hoursPerMonth > competitor.limit && competitor.limit > 0) {
      const overageHours = hoursPerMonth - competitor.limit;
      competitorCost += overageHours * competitor.overageRate;
    } else if (competitor.limit === 0) {
      // Rev.com charges per minute
      competitorCost = hoursPerMonth * competitor.overageRate;
    }

    const voiceflowCost = 7.99;
    const monthlySavings = competitorCost - voiceflowCost;
    const yearlySavings = monthlySavings * 12;

    setSavings({
      monthly: Math.max(0, monthlySavings),
      yearly: Math.max(0, yearlySavings),
    });
  }, [hoursPerMonth, selectedCompetitor]);

  return (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: spacing.lg,
      padding: isMobile ? spacing.lg : spacing.xl,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: `2px solid ${colors.border}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}>
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            margin: 0,
          }}>
            Savings Calculator
          </h3>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            margin: 0,
          }}>
            See how much you'll save
          </p>
        </div>
      </div>

      {/* Hours Slider */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{
          display: 'block',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>
          Hours of transcription per month: <strong>{hoursPerMonth}</strong>
        </label>
        <input
          type="range"
          min="5"
          max="100"
          value={hoursPerMonth}
          onChange={(e) => setHoursPerMonth(Number(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        }}>
          <span>5 hrs</span>
          <span>100 hrs</span>
        </div>
      </div>

      {/* Competitor Selector */}
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{
          display: 'block',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>
          Compare with:
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.sm,
        }}>
          {(Object.keys(competitors) as Array<keyof typeof competitors>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedCompetitor(key)}
              style={{
                padding: spacing.md,
                borderRadius: spacing.md,
                border: `2px solid ${selectedCompetitor === key ? colors.primary : colors.border}`,
                backgroundColor: selectedCompetitor === key ? `${colors.primary}15` : colors.background,
                color: selectedCompetitor === key ? colors.primary : colors.text,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {competitors[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{
        backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: spacing.lg,
        padding: spacing.lg,
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          marginBottom: spacing.sm,
        }}>
          <TrendingDown className="w-5 h-5" />
          <span style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>
            You'll save
          </span>
        </div>

        <div style={{
          fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.bold,
          marginBottom: spacing.xs,
        }}>
          ${savings.monthly.toFixed(2)}/mo
        </div>

        <div style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          opacity: 0.9,
        }}>
          ${savings.yearly.toFixed(2)}/year
        </div>

        <div style={{
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          fontSize: typography.fontSize.sm,
          opacity: 0.9,
        }}>
          vs {competitors[selectedCompetitor].name} at {hoursPerMonth} hours/month
        </div>
      </div>

      {/* CTA */}
      <div style={{
        marginTop: spacing.lg,
        textAlign: 'center',
      }}>
        <a
          href="/signup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.md} ${spacing.xl}`,
            backgroundColor: colors.primary,
            color: '#ffffff',
            borderRadius: spacing.md,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            textDecoration: 'none',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <DollarSign className="w-5 h-5" />
          Start Saving Today
        </a>
      </div>
    </div>
  );
};

export default SavingsCalculator;

