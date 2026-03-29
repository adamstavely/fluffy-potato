import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';

import { AnalyticsService } from '../../platform/analytics.service';

@Directive({
  selector: '[saTrackCardView]',
  standalone: true,
})
export class ToolCardViewDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly analytics = inject(AnalyticsService);

  readonly saTrackCardViewToolId = input.required<string>({ alias: 'saTrackCardViewToolId' });
  readonly saTrackCardViewCategory = input.required<string>({ alias: 'saTrackCardViewCategory' });

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) {
          this.analytics.track('tool_card_viewed', {
            toolId: this.saTrackCardViewToolId(),
            category: this.saTrackCardViewCategory(),
          });
          this.observer?.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
