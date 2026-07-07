/**
 * Minimal above-the-fold CSS inlined before framework styles.
 * Pairs with `experimental.inlineCss` in next.config.ts (production only):
 * Next.js replaces blocking `<link rel="stylesheet">` chunks with inline `<style>` tags.
 *
 * Keep in sync with hero, header shell, and design tokens in globals.css.
 */
export const CRITICAL_CSS = `:root{
--color-bg-primary:#F7F8FA;--color-bg-elevated:#F1F3F7;--color-bg-surface:#FFF;
--color-text-primary:#0F172A;--color-text-secondary:#334155;--color-text-muted:#64748B;
--color-text-inverse:#f0f2f5;--color-text-inverse-muted:#9aa4b2;
--color-accent:#FFC107;--color-accent-hover:#E0A800;--color-border:#CBD5E1;
--font-sans:var(--font-inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);
--radius:10px;color-scheme:light}
*,*::before,*::after{box-sizing:border-box;border-color:var(--color-border)}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scroll-behavior:auto}
body{margin:0;position:relative;min-height:100dvh;display:flex;flex-direction:column;
font-family:var(--font-sans);color:var(--color-text-primary);background-color:var(--color-bg-primary)}
.flex{display:flex}.flex-col{flex-direction:column}.flex-1{flex:1 1 0%}
.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.justify-center{justify-content:center}
.justify-between{justify-content:space-between}.grid{display:grid}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.relative{position:relative}.absolute{position:absolute}.fixed{position:fixed}
.inset-0{top:0;right:0;bottom:0;left:0}.top-0{top:0}.left-0{left:0}.right-0{right:0}
.overflow-hidden{overflow:hidden}.pointer-events-none{pointer-events:none}
.block{display:block}.inline-flex{display:inline-flex}
.min-h-screen{min-height:100vh}.min-h-dvh{min-height:100dvh}.h-full{height:100%}
.w-full{width:100%}.max-w-3xl{max-width:48rem}.max-w-xl{max-width:36rem}
.object-cover{object-fit:cover}
.-z-10{z-index:-10}.-z-20{z-index:-20}.z-10{z-index:10}.z-\\[45\\]{z-index:45}
.-mt-\\[70px\\]{margin-top:-70px}.pt-\\[70px\\]{padding-top:70px}
.mb-6{margin-bottom:1.5rem}.mb-10{margin-bottom:2.5rem}.mt-0\\.5{margin-top:.125rem}
.mt-28{margin-top:7rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-8{gap:2rem}
.py-24{padding-top:6rem;padding-bottom:6rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}
.text-center{text-align:center}.text-lg{font-size:1.125rem;line-height:1.75rem}
.text-base{font-size:1rem;line-height:1.5rem}.text-sm{font-size:.875rem;line-height:1.25rem}
.text-\\[11px\\]{font-size:11px}.text-\\[15px\\]{font-size:15px}
.font-medium{font-weight:500}.font-bold{font-weight:700}
.leading-none{line-height:1}.leading-snug{line-height:1.375}.leading-relaxed{line-height:1.625}
.text-display{font-size:clamp(2.5rem,5vw,4.5rem);font-weight:700;letter-spacing:-.02em;line-height:1.1}
.text-impact{font-size:clamp(2rem,4vw,3.25rem);font-weight:800;letter-spacing:-.03em;line-height:1}
.text-text-inverse{color:var(--color-text-inverse)}.text-text-inverse-muted{color:var(--color-text-inverse-muted)}
.text-text-primary{color:var(--color-text-primary)}.text-text-secondary{color:var(--color-text-secondary)}
.text-accent{color:var(--color-accent)}.text-white\\/88{color:rgb(255 255 255/.88)}
.bg-transparent{background-color:transparent}.bg-accent{background-color:var(--color-accent)}
.bg-bg-elevated{background-color:var(--color-bg-elevated)}.text-black{color:#000}
.border{border-width:1px;border-style:solid}.border-border{border-color:var(--color-border)}
.rounded-md{border-radius:var(--radius)}.shadow-sm{box-shadow:0 1px 2px 0 rgb(15 23 42/.08)}
.h-12{height:3rem}.min-h-12{min-height:3rem}.h-\\[70px\\]{height:70px}
.px-7{padding-left:1.75rem;padding-right:1.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}
.gap-2\\.5{gap:.625rem}.shrink-0{flex-shrink:0}
.container-xl{width:100%;max-width:1400px;margin-inline:auto;padding-inline:clamp(1rem,4vw,3rem)}
.header-autocast-wordmark{display:inline-block;transform:translateY(.08em)}
span.text-accent,a.text-accent,p.text-accent,li.text-accent{font-size:inherit;line-height:inherit}
@media(min-width:768px){
.md\\:inline-flex{display:inline-flex}.md\\:w-auto{width:auto}.md\\:flex-row{flex-direction:row}
.md\\:flex-wrap{flex-wrap:wrap}.md\\:min-h-12{min-height:3rem}.md\\:px-8{padding-left:2rem;padding-right:2rem}
.md\\:py-0{padding-top:0;padding-bottom:0}.md\\:text-base{font-size:1rem;line-height:1.5rem}
.md\\:whitespace-nowrap{white-space:nowrap}}
@media(min-width:1024px){
.lg\\:min-w-\\[11\\.7rem\\]{min-width:11.7rem}.lg\\:mt-44{margin-top:11rem}
.lg\\:flex-row{flex-direction:row}.lg\\:items-stretch{align-items:stretch}}`
