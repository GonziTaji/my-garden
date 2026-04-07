interface SpacerProps {
    /** 
     * This comment can be out of date. Confirm with the variables.css file
     *
     * 1: 4px
     * 2: 8px
     * 3: 12px
     * 4: 18px
     * 5: 24px
     * 6: 32px
     */
    space: 1 | 2 | 3 | 4 | 5 | 6
}

export default function Spacer({ space }: SpacerProps) {
    return <div style={{ display: 'block', height: `var(--space-${space})` }}>&nbsp;</div>
}
