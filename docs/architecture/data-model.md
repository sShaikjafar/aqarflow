# AqarFlow – MVP Data Model

All business tables include: `id` (UUID), `agency_id`, `created_at`, `updated_at`.
Every query is scoped by `agency_id` for tenant isolation.

## agencies
name, slug, timezone, default_currency, status

## users
agency_id, full_name, email, phone, password_hash, role (admin | agent), status

## properties
agency_id, reference_code (unique per agency), title, description, purpose (sale | rent),
property_type, price, currency, area_value, area_unit, bedrooms, bathrooms,
address, city, locality, status (draft | available | reserved | sold | rented | inactive),
is_published, assigned_agent_id

## property_media
property_id, storage_key, caption, sort_order, is_cover

## contacts
agency_id, name, phone, email, contact_type

## leads
agency_id, contact_id, property_id, source, budget_min, budget_max,
stage (new | contacted | qualified | visit_scheduled | negotiation | converted | lost),
assigned_agent_id, next_follow_up_at

## activities
agency_id, lead_id, user_id, activity_type (note | call | meeting), body, occurred_at

## visits
agency_id, property_id, lead_id, agent_id, starts_at, ends_at,
status (requested | confirmed | completed | cancelled | no_show), notes

## deals
agency_id, property_id, lead_id, agent_id,
stage (inquiry | qualified | visit | offer | negotiation | booking | closed_won | closed_lost),
offer_amount, agreed_amount, expected_close_date, notes

## Relationships
- agency 1 → N users, properties, contacts, leads, visits, deals
- property 1 → N property_media, leads, visits, deals
- contact 1 → N leads
- lead 1 → N activities, visits; lead 1 → 0..1 deal
- agent (user) 1 → N leads, visits, deals