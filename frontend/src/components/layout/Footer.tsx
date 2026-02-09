function Footer() {
  return (
    <footer className="border-t border-border bg-card py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Wargame Bandits. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
