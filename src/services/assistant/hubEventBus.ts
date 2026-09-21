/**
 * HUB EVENT BUS — BARRAMENTO REATIVO DE EVENTOS DO HUB 2.0
 * 
 * Camada de presença contínua que conecta as ações reais da aplicação
 * ao Motor de Iniciativa do Auxiliar Mestre sem a necessidade de polling ineficiente.
 */

import { HubEventType } from '../../types';

export type { HubEventType };

export interface HubEvent<T = any> {
  id: string;
  type: HubEventType;
  timestamp: number;
  payload: T;
  source?: string;
}

type EventSubscriber = (event: HubEvent) => void;

class HubEventBus {
  private subscribers: Set<EventSubscriber> = new Set();
  private recentEvents: HubEvent[] = [];
  private readonly maxRecent = 50;

  /**
   * Publica um evento no ecossistema do Hub.
   */
  public publish<T = any>(type: HubEventType, payload: T, source: string = 'hub_system'): HubEvent<T> {
    const event: HubEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      timestamp: Date.now(),
      payload,
      source,
    };

    // Mantém histórico recente para análise contextual
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxRecent) {
      this.recentEvents.pop();
    }

    // Notifica todos os observadores síncrona e seguramente
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(event);
      } catch (err) {
        console.error('[HubEventBus] Erro no assinante de evento:', err);
      }
    });

    return event;
  }

  /**
   * Assina o fluxo de eventos. Retorna função de desinscrição.
   */
  public subscribe(subscriber: EventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Obtém eventos recentes publicados.
   */
  public getRecentEvents(limitCount = 10): HubEvent[] {
    return this.recentEvents.slice(0, limitCount);
  }

  /**
   * Limpa histórico de eventos (útil para testes).
   */
  public clear(): void {
    this.recentEvents = [];
  }
}

export const hubEventBus = new HubEventBus();

/**
 * Atalho global para publicação de eventos.
 */
export function publishHubEvent<T = any>(type: HubEventType, payload: T, source?: string): HubEvent<T> {
  return hubEventBus.publish(type, payload, source);
}

/**
 * Atalho global para inscrição de eventos.
 */
export function subscribeHubEvent(subscriber: (event: HubEvent) => void): () => void {
  return hubEventBus.subscribe(subscriber);
}
