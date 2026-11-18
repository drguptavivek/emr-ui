'use client';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
  type TextStyle,
} from 'react-native';
import { ThemedInput } from './inputs-core';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  APPOINTMENT_STATUSES,
  CALENDAR_VIEW_MODE_OPTIONS,
  SBAR_SEVERITY_CHOICES,
  WAITLIST_FILTER_OPTIONS,
  WAITLIST_PRIORITY_OPTIONS,
  WAITLIST_STATUS_OPTIONS,
  WARD_BED_STATUS_OPTIONS,
  WARD_STATUS_FILTER_OPTIONS,
  computeWardCensusOccupancy,
  evaluateWaitlistSlaSummary,
  filterWaitlistEntries,
  filterWardBeds,
  summarizeSbarReadiness,
  summarizeScheduleUtilization,
  type AppointmentCalendarItem,
  type AppointmentCalendarViewMode,
  type AppointmentResourceColumn,
  type AppointmentStatus,
  type EmrAppointmentCalendarIntent,
  type EmrAppointmentCalendarViewModel,
  type EmrSbarHandoverIntent,
  type EmrSbarHandoverViewModel,
  type EmrWaitlistQueueIntent,
  type EmrWaitlistQueueViewModel,
  type EmrWardBedBoardIntent,
  type EmrWardBedBoardViewModel,
  type SbarActionItem,
  type SbarIllnessSeverity,
  type SbarSectionKey,
  type WaitlistPriorityTier,
  type WaitlistQueueEntry,
  type WaitlistQueueFilter,
  type WaitlistQueueStatus,
  type WardBedCell,
  type WardBedStatus,
  type WardBedStatusFilter,
  type WardIsolationPrecaution,
} from './l4-hospital-operations.logic';

export type {
  AppointmentCalendarItem,
  AppointmentCalendarViewMode,
  AppointmentResourceColumn,
  AppointmentStatus,
  EmrAppointmentCalendarIntent,
  EmrAppointmentCalendarViewModel,
  EmrSbarHandoverIntent,
  EmrSbarHandoverViewModel,
  EmrWaitlistQueueIntent,
  EmrWaitlistQueueViewModel,
  EmrWardBedBoardIntent,
  EmrWardBedBoardViewModel,
  SbarActionItem,
  SbarIllnessSeverity,
  SbarSectionKey,
  WaitlistPriorityTier,
  WaitlistQueueEntry,
  WaitlistQueueFilter,
  WaitlistQueueStatus,
  WardBedCell,
  WardBedStatus,
  WardBedStatusFilter,
  WardIsolationPrecaution,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrAppointmentCalendar
// ===========================================================================

export interface EmrAppointmentCalendarProps {
  model: EmrAppointmentCalendarViewModel;
  headingId?: string;
  onIntent?: (intent: EmrAppointmentCalendarIntent) => void;
}

export function EmrAppointmentCalendar({
  model,
  headingId = 'emr-appointment-calendar-heading',
  onIntent,
}: EmrAppointmentCalendarProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const summary = summarizeScheduleUtilization(model.appointments);

  const emit = (intent: EmrAppointmentCalendarIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.tag,
              {
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontFamily: t.fontMono,
              },
            ]}
          >
            MULTI-RESOURCE CLINIC & OT SCHEDULE · {model.activeDate}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Outpatient Clinic & Operating Theatre Schedule'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
              {model.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{ label: `Total: ${summary.totalCount}`, tone: 'info' }}
          />
          <EmrBadgeView
            badge={{
              label: `Checked-In / Active: ${summary.checkedInCount}`,
              tone: 'success',
            }}
          />
          {summary.conflictCount > 0 ? (
            <EmrBadgeView
              badge={{
                label: `Conflicts: ${summary.conflictCount}`,
                tone: 'danger',
              }}
            />
          ) : null}
        </View>
      </View>

      <View role="group" aria-label="Calendar view mode" style={styles.row}>
        {CALENDAR_VIEW_MODE_OPTIONS.map((mode) => {
          const active = (model.viewMode ?? 'resource-grid') === mode.id;
          return (
            <Pressable
              key={mode.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() => emit({ type: 'viewModeChanged', viewMode: mode.id })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  { color: active ? t.primary : t.text, fontSize: t.textXs },
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {model.resources.map((res) => {
          const resAppointments = model.appointments.filter(
            (a) => a.resourceId === res.id,
          );
          return (
            <View
              key={res.id}
              role="group"
              aria-label={`Resource column ${res.name}`}
              style={[
                styles.panel,
                { borderColor: t.border, backgroundColor: t.surfaceRaised },
              ]}
            >
              <View style={styles.rowBetween}>
                <View>
                  <Text
                    style={[font, bold, { color: t.text, fontSize: t.textMd }]}
                  >
                    {res.name}
                  </Text>
                  {res.roleOrLocation ? (
                    <Text
                      style={[font, { color: t.textMuted, fontSize: t.textXs }]}
                    >
                      {res.roleOrLocation}
                    </Text>
                  ) : null}
                </View>
                {res.utilizationPct !== undefined ? (
                  <EmrBadgeView
                    badge={{
                      label: `${res.utilizationPct}% Utilized`,
                      tone: res.utilizationPct >= 90 ? 'warning' : 'info',
                    }}
                  />
                ) : null}
              </View>

              <View
                role="group"
                aria-label={`Time slots ${res.name}`}
                style={styles.row}
              >
                {model.slots.map((slot) => (
                  <Pressable
                    key={slot}
                    role="button"
                    disabled={readOnly}
                    onPress={() =>
                      emit({
                        type: 'slotBookRequested',
                        resourceId: res.id,
                        startTime: slot,
                      })
                    }
                    style={(s: PressState) => [
                      styles.chip,
                      { borderColor: t.border, backgroundColor: t.surface },
                      focusRing(t, s.focused),
                    ]}
                  >
                    <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                      + {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View role="list" style={styles.listGap}>
                {resAppointments.map((apt) => {
                  const selected = model.selectedAppointmentId === apt.id;
                  return (
                    <View
                      key={apt.id}
                      role="listitem"
                      style={[
                        styles.panel,
                        {
                          borderColor: selected ? t.primary : t.border,
                          backgroundColor: selected ? t.primarySoft : t.surface,
                        },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <Pressable
                          role="button"
                          aria-pressed={selected}
                          onPress={() =>
                            onIntent?.({
                              type: 'appointmentSelected',
                              appointmentId: apt.id,
                            })
                          }
                          style={(s: PressState) => [
                            styles.chip,
                            { borderColor: t.border, backgroundColor: t.surface },
                            focusRing(t, s.focused),
                          ]}
                        >
                          <Text
                            style={[
                              font,
                              bold,
                              { color: t.text, fontSize: t.textSm },
                            ]}
                          >
                            {apt.startTime} ({apt.durationMinutes}m) · {apt.patientName}
                          </Text>
                        </Pressable>
                        <View style={styles.row}>
                          <EmrBadgeView
                            badge={{
                              label: apt.status,
                              tone:
                                apt.status === 'cancelled' ||
                                apt.status === 'no-show'
                                  ? 'danger'
                                  : 'info',
                            }}
                          />
                          {apt.conflictFlag ? (
                            <EmrBadgeView
                              badge={{
                                label: 'OVERBOOK CONFLICT',
                                tone: 'danger',
                              }}
                            />
                          ) : null}
                          {apt.badge ? <EmrBadgeView badge={apt.badge} /> : null}
                        </View>
                      </View>
                      <Text
                        style={[font, { color: t.textMuted, fontSize: t.textXs }]}
                      >
                        {apt.visitType}
                        {apt.mrn ? ` · ${apt.mrn}` : ''}
                      </Text>
                      <View
                        role="group"
                        aria-label={`Status actions ${apt.patientName}`}
                        style={styles.row}
                      >
                        {APPOINTMENT_STATUSES.map((st) => {
                          const activeSt = apt.status === st;
                          return (
                            <Pressable
                              key={st}
                              role="button"
                              aria-pressed={activeSt}
                              disabled={readOnly}
                              onPress={() =>
                                emit({
                                  type: 'appointmentStatusChanged',
                                  appointmentId: apt.id,
                                  status: st,
                                })
                              }
                              style={(s: PressState) => [
                                styles.chip,
                                {
                                  borderColor: activeSt ? t.primary : t.border,
                                  backgroundColor: activeSt
                                    ? t.primarySoft
                                    : t.surface,
                                },
                                focusRing(t, s.focused),
                              ]}
                            >
                              <Text
                                style={[
                                  font,
                                  bold,
                                  {
                                    color: activeSt ? t.primary : t.text,
                                    fontSize: t.textXs,
                                  },
                                ]}
                              >
                                {st}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrWaitlistQueue
// ===========================================================================

export interface EmrWaitlistQueueProps {
  model: EmrWaitlistQueueViewModel;
  headingId?: string;
  onIntent?: (intent: EmrWaitlistQueueIntent) => void;
}

export function EmrWaitlistQueue({
  model,
  headingId = 'emr-waitlist-queue-heading',
  onIntent,
}: EmrWaitlistQueueProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const sla = evaluateWaitlistSlaSummary(model.entries);
  const visible = filterWaitlistEntries(model);

  const emit = (intent: EmrWaitlistQueueIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.tag,
              {
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontFamily: t.fontMono,
              },
            ]}
          >
            LIVE CLINIC & DIAGNOSTICS TOKEN QUEUE
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? 'Patient Waitlist & Token Queue'}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
              {model.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{ label: `Waiting: ${sla.waitingCount}`, tone: 'info' }}
          />
          <EmrBadgeView
            badge={{
              label: `SLA Breached: ${sla.breachedCount}`,
              tone: sla.breachedCount > 0 ? 'danger' : 'success',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `Max Wait: ${sla.maxWaitMinutes}m`,
              tone: 'warning',
            }}
          />
        </View>
      </View>

      <View role="group" aria-label="Waitlist queue filter" style={styles.row}>
        {WAITLIST_FILTER_OPTIONS.map((flt) => {
          const active = (model.activeFilter ?? 'all') === flt.id;
          return (
            <Pressable
              key={flt.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() => emit({ type: 'filterChanged', filter: flt.id })}
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  { color: active ? t.primary : t.text, fontSize: t.textXs },
                ]}
              >
                {flt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View role="list" aria-label="Waitlist token entries" style={styles.listGap}>
        {visible.map((entry) => {
          const breached = entry.waitMinutes > entry.slaTargetMinutes;
          return (
            <View
              key={entry.id}
              role="listitem"
              style={[
                styles.panel,
                { borderColor: t.border, backgroundColor: t.surfaceRaised },
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <EmrBadgeView
                    badge={{
                      label: entry.tokenNumber,
                      tone: entry.priority === 'stat' ? 'danger' : 'info',
                    }}
                  />
                  <Text
                    style={[font, bold, { color: t.text, fontSize: t.textMd }]}
                  >
                    {entry.patientName}
                  </Text>
                  <Text
                    style={[font, { color: t.textMuted, fontSize: t.textXs }]}
                  >
                    {entry.departmentOrRoom}
                  </Text>
                </View>
                <View style={styles.row}>
                  <EmrBadgeView
                    badge={{
                      label: `${entry.waitMinutes}m / ${entry.slaTargetMinutes}m${breached ? ' (BREACH)' : ''}`,
                      tone: breached ? 'danger' : 'success',
                    }}
                  />
                  {entry.badge ? <EmrBadgeView badge={entry.badge} /> : null}
                </View>
              </View>

              <View style={styles.rowBetween}>
                <View
                  role="group"
                  aria-label={`Priority tier ${entry.tokenNumber}`}
                  style={styles.row}
                >
                  {WAITLIST_PRIORITY_OPTIONS.map((prio) => {
                    const activePrio = entry.priority === prio;
                    return (
                      <Pressable
                        key={prio}
                        role="button"
                        aria-pressed={activePrio}
                        disabled={readOnly}
                        onPress={() =>
                          emit({
                            type: 'priorityChanged',
                            entryId: entry.id,
                            priority: prio,
                          })
                        }
                        style={(s: PressState) => [
                          styles.chip,
                          {
                            borderColor: activePrio ? t.primary : t.border,
                            backgroundColor: activePrio
                              ? t.primarySoft
                              : t.surface,
                          },
                          focusRing(t, s.focused),
                        ]}
                      >
                        <Text
                          style={[
                            font,
                            bold,
                            {
                              color: activePrio ? t.primary : t.text,
                              fontSize: t.textXs,
                            },
                          ]}
                        >
                          {prio}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.row}>
                  <Pressable
                    role="button"
                    disabled={readOnly}
                    onPress={() =>
                      emit({
                        type: 'patientCalled',
                        entryId: entry.id,
                        tokenNumber: entry.tokenNumber,
                      })
                    }
                    style={(s: PressState) => [
                      styles.chip,
                      {
                        borderColor: t.primary,
                        backgroundColor: t.primarySoft,
                      },
                      focusRing(t, s.focused),
                    ]}
                  >
                    <Text
                      style={[
                        font,
                        bold,
                        { color: t.primary, fontSize: t.textXs },
                      ]}
                    >
                      Call {entry.tokenNumber}
                    </Text>
                  </Pressable>
                  {WAITLIST_STATUS_OPTIONS.map((st) => {
                    const activeSt = entry.status === st;
                    return (
                      <Pressable
                        key={st}
                        role="button"
                        aria-pressed={activeSt}
                        disabled={readOnly}
                        onPress={() =>
                          emit({
                            type: 'entryStatusChanged',
                            entryId: entry.id,
                            status: st,
                          })
                        }
                        style={(s: PressState) => [
                          styles.chip,
                          {
                            borderColor: activeSt ? t.primary : t.border,
                            backgroundColor: activeSt
                              ? t.primarySoft
                              : t.surface,
                          },
                          focusRing(t, s.focused),
                        ]}
                      >
                        <Text
                          style={[
                            font,
                            bold,
                            {
                              color: activeSt ? t.primary : t.text,
                              fontSize: t.textXs,
                            },
                          ]}
                        >
                          {st}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrWardBedBoard
// ===========================================================================

export interface EmrWardBedBoardProps {
  model: EmrWardBedBoardViewModel;
  headingId?: string;
  onIntent?: (intent: EmrWardBedBoardIntent) => void;
}

export function EmrWardBedBoard({
  model,
  headingId = 'emr-ward-bed-board-heading',
  onIntent,
}: EmrWardBedBoardProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const census = computeWardCensusOccupancy(model.beds);
  const visibleBeds = filterWardBeds(model);

  const emit = (intent: EmrWardBedBoardIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.tag,
              {
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontFamily: t.fontMono,
              },
            ]}
          >
            INPATIENT ADT WARD BED CENSUS · {model.wardName}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ?? model.wardName}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
              {model.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{
              label: `Occupancy: ${census.occupiedBeds}/${census.totalBeds} (${census.occupancyPct}%)`,
              tone: 'info',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `Available: ${census.availableBeds}`,
              tone: 'success',
            }}
          />
          {census.dirtyBeds > 0 ? (
            <EmrBadgeView
              badge={{ label: `Dirty: ${census.dirtyBeds}`, tone: 'warning' }}
            />
          ) : null}
        </View>
      </View>

      <View role="group" aria-label="Ward bed status filter" style={styles.row}>
        {WARD_STATUS_FILTER_OPTIONS.map((flt) => {
          const active = (model.activeStatusFilter ?? 'all') === flt.id;
          return (
            <Pressable
              key={flt.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() =>
                emit({ type: 'statusFilterChanged', filter: flt.id })
              }
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  { color: active ? t.primary : t.text, fontSize: t.textXs },
                ]}
              >
                {flt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {visibleBeds.map((bed) => {
          const selected = model.selectedBedId === bed.id;
          return (
            <View
              key={bed.id}
              role="group"
              aria-label={`Bed ${bed.bedNumber}`}
              style={[
                styles.panel,
                {
                  borderColor: selected ? t.primary : t.border,
                  backgroundColor: selected ? t.primarySoft : t.surfaceRaised,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Pressable
                  role="button"
                  aria-pressed={selected}
                  onPress={() =>
                    onIntent?.({ type: 'bedSelected', bedId: bed.id })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    { borderColor: t.border, backgroundColor: t.surface },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text
                    style={[font, bold, { color: t.text, fontSize: t.textSm }]}
                  >
                    {bed.bedNumber}
                    {bed.roomLabel ? ` · ${bed.roomLabel}` : ''}
                  </Text>
                </Pressable>
                <View style={styles.row}>
                  <EmrBadgeView
                    badge={{
                      label: bed.status,
                      tone:
                        bed.status === 'available'
                          ? 'success'
                          : bed.status === 'isolation'
                            ? 'danger'
                            : 'info',
                    }}
                  />
                  {bed.isolationType && bed.isolationType !== 'none' ? (
                    <EmrBadgeView
                      badge={{
                        label: `ISO: ${bed.isolationType}`,
                        tone: 'danger',
                      }}
                    />
                  ) : null}
                  {bed.dischargePlannedToday ? (
                    <EmrBadgeView
                      badge={{ label: 'Discharge Today', tone: 'warning' }}
                    />
                  ) : null}
                </View>
              </View>

              {bed.patientName ? (
                <View>
                  <Text
                    style={[font, bold, { color: t.text, fontSize: t.textMd }]}
                  >
                    {bed.patientName}
                  </Text>
                  <Text
                    style={[font, { color: t.textMuted, fontSize: t.textXs }]}
                  >
                    {bed.mrn ?? ''}
                    {bed.attendingDoctor ? ` · ${bed.attendingDoctor}` : ''}
                    {bed.losDays !== undefined ? ` · LOS ${bed.losDays}d` : ''}
                    {bed.ewsScore !== undefined ? ` · EWS ${bed.ewsScore}` : ''}
                  </Text>
                </View>
              ) : (
                <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
                  Unoccupied Bed
                </Text>
              )}

              <View
                role="group"
                aria-label={`Bed status ${bed.bedNumber}`}
                style={styles.row}
              >
                {WARD_BED_STATUS_OPTIONS.map((st) => {
                  const activeSt = bed.status === st;
                  return (
                    <Pressable
                      key={st}
                      role="button"
                      aria-pressed={activeSt}
                      disabled={readOnly}
                      onPress={() =>
                        emit({
                          type: 'bedStatusChanged',
                          bedId: bed.id,
                          status: st,
                        })
                      }
                      style={(s: PressState) => [
                        styles.chip,
                        {
                          borderColor: activeSt ? t.primary : t.border,
                          backgroundColor: activeSt ? t.primarySoft : t.surface,
                        },
                        focusRing(t, s.focused),
                      ]}
                    >
                      <Text
                        style={[
                          font,
                          bold,
                          {
                            color: activeSt ? t.primary : t.text,
                            fontSize: t.textXs,
                          },
                        ]}
                      >
                        {st}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  role="button"
                  disabled={readOnly}
                  onPress={() =>
                    emit({ type: 'transferRequested', fromBedId: bed.id })
                  }
                  style={(s: PressState) => [
                    styles.chip,
                    { borderColor: t.border, backgroundColor: t.surface },
                    focusRing(t, s.focused),
                  ]}
                >
                  <Text style={[font, bold, { color: t.text, fontSize: t.textXs }]}>
                    Transfer
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 4. EmrSbarHandover
// ===========================================================================

export interface EmrSbarHandoverProps {
  model: EmrSbarHandoverViewModel;
  headingId?: string;
  onIntent?: (intent: EmrSbarHandoverIntent) => void;
}

export function EmrSbarHandover({
  model,
  headingId = 'emr-sbar-handover-heading',
  onIntent,
}: EmrSbarHandoverProps) {
  const t = useEmrTheme();
  const font: TextStyle = { fontFamily: fontFamily(t) };
  const bold: TextStyle = { fontWeight: fontWeight(t.weightBold) };
  const readOnly = !!model.readOnly;
  const readiness = summarizeSbarReadiness(model);

  const emit = (intent: EmrSbarHandoverIntent) => {
    if (!readOnly) onIntent?.(intent);
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.tag,
              {
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontFamily: t.fontMono,
              },
            ]}
          >
            SBAR CLINICAL SHIFT HANDOVER · {model.shiftLabel}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={[font, bold, { color: t.text, fontSize: t.textLg }]}
          >
            {model.title ??
              `${model.patientName}${model.bedLabel ? ` · ${model.bedLabel}` : ''}`}
          </Text>
          {model.subtitle ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>
              {model.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <EmrBadgeView
            badge={{
              label: `Severity: ${model.illnessSeverity}`,
              tone:
                model.illnessSeverity === 'unstable-critical'
                  ? 'danger'
                  : model.illnessSeverity === 'watcher'
                    ? 'warning'
                    : 'success',
            }}
          />
          <EmrBadgeView
            badge={{
              label: `Actions: ${readiness.completedActionCount}/${model.actionItems.length} Done (${readiness.openActionCount} Open)`,
              tone: 'info',
            }}
          />
        </View>
      </View>

      <View
        role="group"
        aria-label="Illness severity classification"
        style={styles.row}
      >
        {SBAR_SEVERITY_CHOICES.map((sev) => {
          const active = model.illnessSeverity === sev.id;
          return (
            <Pressable
              key={sev.id}
              role="button"
              aria-pressed={active}
              disabled={readOnly}
              onPress={() =>
                emit({ type: 'illnessSeverityChanged', severity: sev.id })
              }
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  { color: active ? t.primary : t.text, fontSize: t.textXs },
                ]}
              >
                {sev.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        <View
          style={[
            styles.panel,
            { borderColor: t.border, backgroundColor: t.surfaceRaised },
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            S — Situation
          </Text>
          <ThemedInput
            value={model.situation}
            editable={!readOnly}
            aria-label="Situation narrative"
            onChangeText={(val) =>
              emit({ type: 'sectionEdited', section: 'situation', text: val })
            }
          />
        </View>
        <View
          style={[
            styles.panel,
            { borderColor: t.border, backgroundColor: t.surfaceRaised },
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            B — Background
          </Text>
          <ThemedInput
            value={model.background}
            editable={!readOnly}
            aria-label="Background narrative"
            onChangeText={(val) =>
              emit({ type: 'sectionEdited', section: 'background', text: val })
            }
          />
        </View>
        <View
          style={[
            styles.panel,
            { borderColor: t.border, backgroundColor: t.surfaceRaised },
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            A — Assessment
          </Text>
          <ThemedInput
            value={model.assessment}
            editable={!readOnly}
            aria-label="Assessment narrative"
            onChangeText={(val) =>
              emit({ type: 'sectionEdited', section: 'assessment', text: val })
            }
          />
        </View>
        <View
          style={[
            styles.panel,
            { borderColor: t.border, backgroundColor: t.surfaceRaised },
          ]}
        >
          <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
            R — Recommendation
          </Text>
          <ThemedInput
            value={model.recommendation}
            editable={!readOnly}
            aria-label="Recommendation narrative"
            onChangeText={(val) =>
              emit({
                type: 'sectionEdited',
                section: 'recommendation',
                text: val,
              })
            }
          />
        </View>
      </View>

      <View
        role="group"
        aria-label="Pending shift action items"
        style={[
          styles.panel,
          { borderColor: t.border, backgroundColor: t.surfaceRaised },
        ]}
      >
        <Text style={[font, bold, { color: t.text, fontSize: t.textSm }]}>
          Actionable Pending To-Do Checklist
        </Text>
        <View style={styles.row}>
          {model.actionItems.map((item) => (
            <Pressable
              key={item.id}
              role="button"
              aria-pressed={item.completed}
              disabled={readOnly}
              onPress={() =>
                emit({
                  type: 'actionItemToggled',
                  itemId: item.id,
                  completed: !item.completed,
                })
              }
              style={(s: PressState) => [
                styles.chip,
                {
                  borderColor: item.completed ? t.primary : t.border,
                  backgroundColor: item.completed ? t.primarySoft : t.surface,
                },
                focusRing(t, s.focused),
              ]}
            >
              <Text
                style={[
                  font,
                  bold,
                  {
                    color: item.completed ? t.primary : t.text,
                    fontSize: t.textXs,
                  },
                ]}
              >
                {item.completed ? '✓ ' : '○ '}
                {item.label}
                {item.dueByLabel ? ` (${item.dueByLabel})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.rowBetween}>
        <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>
          Outgoing: {model.outgoingClinician}
          {model.incomingClinician ? ` · Incoming: ${model.incomingClinician}` : ''}
          {model.acknowledgedAt ? ` · Signed ${model.acknowledgedAt}` : ''}
        </Text>
        <Pressable
          role="button"
          aria-pressed={model.acknowledged}
          disabled={readOnly || model.acknowledged}
          onPress={() =>
            emit({
              type: 'handoverAcknowledged',
              incomingClinician: model.incomingClinician,
            })
          }
          style={(s: PressState) => [
            styles.chip,
            {
              borderColor: model.acknowledged ? t.success : t.primary,
              backgroundColor: model.acknowledged ? t.successSoft : t.primarySoft,
            },
            focusRing(t, s.focused),
          ]}
        >
          <Text
            style={[
              font,
              bold,
              {
                color: model.acknowledged ? t.success : t.primary,
                fontSize: t.textXs,
              },
            ]}
          >
            {model.acknowledged
              ? '✓ Handover Acknowledged'
              : 'Acknowledge SBAR Handover'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  titleBlock: {
    gap: 4,
    flexShrink: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    flex: 1,
    minWidth: 250,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  listGap: {
    gap: 8,
  },
});
